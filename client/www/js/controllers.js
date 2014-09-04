angular.module('starter.controllers', [])

.controller('HomeCtrl', function($scope, $ionicModal, $ionicPopup, Section, Util) {
	$scope.$on('section.update', function(){
		$scope.sections = Section.all();
		$scope.$broadcast('scroll.refreshComplete');
	});
	Section.sync();
	$scope.sections = Section.all();

	$scope.refresh = function(){
		Section.sync();
	}

	// $scope.username="";
	// $scope.password="";
	$ionicModal.fromTemplateUrl('templates/signin-modal.html', {
	    scope: $scope,
	    animation: 'slide-in-up'
	  }).then(function(modal) {
	    $scope.signin_modal = modal;
	  });
	  //Cleanup the modal when we're done with it!
	  $scope.$on('$destroy', function() {
	  $scope.signin_modal.remove();
    });

	 $scope.logoutConfirm = function() {
	   var confirmPopup = $ionicPopup.confirm({
	     title: 'Log Out',
	     template: 'Confirm to log out?'
	   });
	   confirmPopup.then(function(res) {
	     if(res) {
	       console.log('You are sure');
	     } else {
	       console.log('You are not sure');
	     }
	   });
	 };

	$scope.signin = function(username, password){
		Util.signin(username, password);
	}
	$scope.is_signedin = Util.is_signedin();
	$scope.$on('login.success', function() {
	  $scope.is_signedin = true;
	  $scope.signin_modal.hide();
    });
    $scope.$on('login.error.password', function() {
	  $scope.signin_feedback = 'Username and Password don\'t match';
    });
    $scope.$on('login.error.connection', function() {
	  $scope.signin_feedback = 'Network connection error';
    });
})

.controller('SectionCtrl', function($scope, $stateParams, $ionicModal, Post, Section, Util) {
	$scope.is_signedin = Util.is_signedin();
	$scope.section = Section.get($stateParams.section_id);
	$scope.$on('post.update', function(){
		$scope.posts = Post.by_section($stateParams.section_id);
		$scope.$broadcast('scroll.refreshComplete');
	});
	Post.sync($stateParams.section_id);
	$scope.$on('post.changed', function(){
		Post.sync($stateParams.section_id);
	});
	$scope.posts = Post.by_section($stateParams.section_id);

	// new post dialog
	$scope.new_post = {
		title: '',
		content: ''
	}
	$ionicModal.fromTemplateUrl('templates/compose-modal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.compose_modal = modal;
	});
	// cleanup modals
	$scope.$on('$destroy', function() {
		$scope.compose_modal.remove();
	});
	$scope.refresh = function(){
		Post.sync($stateParams.section_id);
	}

	$scope.compose = function(){
		$scope.compose_modal.show();
	}

	$scope.publish_post = function(){
		$scope.new_post.section_id = $stateParams.section_id;
		$scope.new_post.uid = Util.get_user_uid();
		Post.add_post($scope.new_post, function(data){
			$scope.posts.unshift(data);
			$scope.compose_modal.hide();
		});
	}
})

.controller('PostCtrl', function($scope, $stateParams, $sce, $ionicActionSheet, $ionicNavBarDelegate, $ionicModal, Post, Util) {
	$scope.is_signedin = Util.is_signedin();
	$scope.post = Post.get($stateParams.post_id);
	$scope.$on('post.load', function(){
		$scope.post = Post.get($stateParams.post_id);
		$scope.htmlSafe = $sce.trustAsHtml($scope.post.content);
		for(var i in $scope.post.comments){
			$scope.post.comments[i].content = $sce.trustAsHtml($scope.post.comments[i].content);
		}
	});

	$ionicModal.fromTemplateUrl('templates/compose-modal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.compose_modal = modal;
	});
	//Cleanup the modal when we're done with it!
	$scope.$on('$destroy', function() {
		$scope.compose_modal.remove();
	});

	$scope.refresh = function(){
		Post.load($stateParams.post_id);
	}

	Post.load($stateParams.post_id);

	$scope.edit = function(){
		$scope.openModal();
	}

	$scope.publish_post = function(){
		
	}


	$scope.delete_post = function(){
		$ionicActionSheet.show({
	     destructiveText: 'Delete',
	     titleText: 'Delete this post?',
	     cancelText: 'Cancel',
	     destructiveButtonClicked: function() {
	     	// $ionicNavBarDelegate.back();
	       Post.delete_post($scope.post.id, function(){
	       		 $ionicNavBarDelegate.back();
	       });
	       // return true;
	     }
	   });
	};

	$scope.close_post = function(){
		var close_sheet = $ionicActionSheet.show({
	     destructiveText: 'Close/Mark as resolved',
	     titleText: 'Close / Mark this post as resolved?',
	     cancelText: 'Cancel',
	     destructiveButtonClicked: function() {
	     	// $ionicNavBarDelegate.back();
	       Post.close_post($scope.post.id, 1-$scope.post.is_closed, function(){
	       		$scope.post.is_closed = 1-$scope.post.is_closed;
	       		close_sheet();
	       });
	       // return true;
	     }
	   });
	};

	// edit post dialog
	$scope.new_post = $scope.post;
	$ionicModal.fromTemplateUrl('templates/compose-modal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.compose_modal = modal;
	});
	$scope.compose = function(){
		$scope.new_post = {
			'id': $scope.post.id,
			'title': $scope.post.title,
			'content': $scope.post.content.replace(/<br\s*\/?>/g, "\r"),
			'is_event': $scope.post.is_event=='1'?true:false,
			'event_time': $scope.post.event_date,
			'images': $scope.post.images
		}
		$scope.compose_modal.show();
	}

	$scope.publish_post = function(){
		Post.add_post($scope.new_post, function(data){
			$scope.refresh();
			$scope.compose_modal.hide();
		});
	}
	

	// reply post dialog
	$ionicModal.fromTemplateUrl('templates/reply-modal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.reply_modal = modal;
	});

	$scope.reply = function(){
		$scope.new_reply = {
			post_id: $scope.post.id
		};
		$scope.reply_modal.show();
	}

	$scope.publish_reply = function(){
		Post.add_comment($scope.new_reply, function(data){
			$scope.refresh();
			$scope.reply_modal.hide();
		});
	}

	// send rsvp dialog
	$ionicModal.fromTemplateUrl('templates/rsvp-modal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.rsvp_modal = modal;
	});
	// cleanup modals
	$scope.$on('$destroy', function() {
		$scope.compose_modal.remove();
		$scope.reply_modal.remove();
		$scope.rsvp_modal.remove();
	});

	$scope.rsvp = function(){
		$scope.new_rsvp = {
			post_id: $scope.post.id
		};
		$scope.rsvp_modal.show();
	}

	$scope.send_rsvp = function(){
		Post.send_rsvp($scope.new_rsvp, function(data){
			$scope.post.rsvped = 1;
			$scope.rsvp_modal.hide();
		});
	}

	$scope.clear_rsvp = function(){
		var clear_rsvp_sheet = $ionicActionSheet.show({
	     destructiveText: 'Cancel Sign-up',
	     titleText: 'Cancel Sign-up/RSVP?',
	     cancelText: 'Cancel',
	     destructiveButtonClicked: function() {
	     	// $ionicNavBarDelegate.back();
	       Post.cancel_rsvp($scope.post.id, function(){
	       		$scope.post.rsvped = 0;
	       		clear_rsvp_sheet();
	       });
	       // return true;
	     }
	   });
	};
})


.service('ScrollRender', function() {
    this.render = function(content) {
        return (function(global) {

            var docStyle = document.documentElement.style;

            var engine;
            if (global.opera && Object.prototype.toString.call(opera) === '[object Opera]') {
                engine = 'presto';
            } else if ('MozAppearance' in docStyle) {
                engine = 'gecko';
            } else if ('WebkitAppearance' in docStyle) {
                engine = 'webkit';
            } else if (typeof navigator.cpuClass === 'string') {
                engine = 'trident';
            }

            var vendorPrefix = {
                trident: 'ms',
                gecko: 'Moz',
                webkit: 'Webkit',
                presto: 'O'
            }[engine];

            var helperElem = document.createElement("div");
            var undef;

            var perspectiveProperty = vendorPrefix + "Perspective";
            var transformProperty = vendorPrefix + "Transform";

            if (helperElem.style[perspectiveProperty] !== undef) {

                return function(left, top, zoom) {
                    content.style[transformProperty] = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
                };

            } else if (helperElem.style[transformProperty] !== undef) {

                return function(left, top, zoom) {
                    content.style[transformProperty] = 'translate(' + (-left) + 'px,' + (-top) + 'px) scale(' + zoom + ')';
                };

            } else {

                return function(left, top, zoom) {
                    content.style.marginLeft = left ? (-left / zoom) + 'px' : '';
                    content.style.marginTop = top ? (-top / zoom) + 'px' : '';
                    content.style.zoom = zoom || '';
                };

            }
        })(this);
    };

})

.directive('zoomable', function(ScrollRender) {
    return {
        link: function(scope, element, attrs) {
            element.bind('load', function() {
                // Intialize layout
                var container = document.getElementById("container");
                var content = document.getElementById("content");
                var clientWidth = 0;
                var clientHeight = 0;

                // Initialize scroller
                var scroller = new Scroller(ScrollRender.render(content), {
                    scrollingX: true,
                    scrollingY: true,
                    animating: true,
                    bouncing: true,
                    locking: true,
                    zooming: true,
                    minZoom: 0.5,
                    maxZoom: 2
                });

                // Initialize scrolling rect
                var rect = container.getBoundingClientRect();
                scroller.setPosition(rect.left + container.clientLeft, rect.top + container.clientTop);
                
                var image = document.getElementById('image-scrollable');
                var contentWidth = image.width;
                var contentHeight = image.height;

                // Reflow handling
                var reflow = function() {
                    clientWidth = container.clientWidth;
                    clientHeight = container.clientHeight;
                    scroller.setDimensions(clientWidth, clientHeight, contentWidth, contentHeight);
                };


                window.addEventListener("resize", reflow, false);
                reflow();

                if ('ontouchstart' in window) {

                    container.addEventListener("touchstart", function(e) {
                        // Don't react if initial down happens on a form element
                        if (e.touches[0] && e.touches[0].target && e.touches[0].target.tagName.match(/input|textarea|select/i)) {
                            return;
                        }

                        scroller.doTouchStart(e.touches, e.timeStamp);
                        e.preventDefault();
                    }, false);

                    document.addEventListener("touchmove", function(e) {
                        scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
                    }, false);

                    document.addEventListener("touchend", function(e) {
                        scroller.doTouchEnd(e.timeStamp);
                    }, false);

                    document.addEventListener("touchcancel", function(e) {
                        scroller.doTouchEnd(e.timeStamp);
                    }, false);

                } else {

                    var mousedown = false;

                    container.addEventListener("mousedown", function(e) {
                        if (e.target.tagName.match(/input|textarea|select/i)) {
                            return;
                        }

                        scroller.doTouchStart([{
                            pageX: e.pageX,
                            pageY: e.pageY
                        }], e.timeStamp);

                        mousedown = true;
                    }, false);

                    document.addEventListener("mousemove", function(e) {
                        if (!mousedown) {
                            return;
                        }

                        scroller.doTouchMove([{
                            pageX: e.pageX,
                            pageY: e.pageY
                        }], e.timeStamp);

                        mousedown = true;
                    }, false);

                    document.addEventListener("mouseup", function(e) {
                        if (!mousedown) {
                            return;
                        }

                        scroller.doTouchEnd(e.timeStamp);

                        mousedown = false;
                    }, false);

                    container.addEventListener(navigator.userAgent.indexOf("Firefox") > -1 ? "DOMMouseScroll" : "mousewheel", function(e) {
                        scroller.doMouseZoom(e.detail ? (e.detail * -120) : e.wheelDelta, e.timeStamp, e.pageX, e.pageY);
                    }, false);
                }
            });
        }
    };
})

.controller('ImageCtrl', function($scope, $stateParams, Util) {
	$scope.url = Util.get_image_base_url()+$stateParams.url;
})

.controller('EventsCtrl', function($scope, $stateParams, Events) {
	if($stateParams.type=='my'){
		var is_my = true;
	}
	else{
		var is_my = false;
	}
	$scope.posts = Events.all(is_my);

	$scope.refresh = function(){
		Events.sync(is_my);
	}
	Events.sync(is_my);

	$scope.$on('events.update', function(){
		$scope.posts = Events.all(is_my);
		$scope.$broadcast('scroll.refreshComplete');
	});
});
