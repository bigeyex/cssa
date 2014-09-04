$(function(){
        $('.event-date').datepicker({format: 'yyyy-mm-dd'})
        
        $('.new-thread-button').click(function(){ edit_dialog.open(); });
        
        $('input[type="checkbox"]').iCheck({
            checkboxClass: 'icheckbox_flat-blue',
            radioClass: 'iradio_flat-blue'
        });
        
        $('#event-checkbox').on('ifToggled', function(){
            if($('#event-checkbox').is(':checked')){
                $('#input-slots').removeClass('hidden');
            }
            else{
                $('#input-slots').addClass('hidden');
            }
        });
    
    }); 

    var edit_dialog = {
        initialized: false,
        image_list : [],
        post: null,
        init: function(){
            var self = this;
            $('#fileupload').fileupload({
                dataType: 'json',
                done: function (e, data) {
                    self.insert_picture(data.result.url);
                }
            });
            $('.submit-create-post-form').click(function(){
                $.post(app_path+'/Post/ajax_add', {
                    'id': $('#post_id').val(),
                    'title': $('#post-title').val(),
                    'content': $('#post-content').val(),
                    'is_event': $('#event-checkbox').prop('checked'),
                    'event_time': $('.event-date').val(), 
                    'signup_slots': $('#signup_slots').val(),
                    'images': self.image_list.join(','),
                    'section_id': $('#section_id').val()
                }, function(p){
                    if(self.post !== null){
                        self.post.update(p.title, p.content, p.publish_time, p.is_event, p.event_time);
                    }
                    else{
                        viewModel.posts.unshift(new Post(p.id, p.title, p.content, p.user_id, '', p.publish_time, p.is_event, 0, 1, 0, p.event_time));
                    }
                }, 'json');
                $('#new-thread-modal').modal('hide');
            });
            self.initialized = true;
        },
        open: function(post, id, title, content, images_str, is_event, event_time, signup_slots){
            var self = this;
            if(!self.initialized) self.init();
            $('#post_id').val(0);
            $('#post-title').val('');
            $('#post-content').val('');
            $('#post-photo-list').empty();
            $('#event-checkbox').iCheck('uncheck')
            if(id !== undefined){
                var self = this;
                self.post = post;
                $('#post_id').val(id);
                $('#post-title').val(title);
                $('#post-content').val(content);
                if(is_event == 1){
                    $('#event-checkbox').iCheck('check')
                }
                if(event_time != null){
                    var event_date = event_time.split(' ')[0]
                    $('.event-date').val(event_date);
                }
                if(images_str != '' && images_str != null){
                    var image_list = images_str.split(',');
                    for(var i in image_list){
                        self.insert_picture(image_list[i]);
                    }
                }
                $('.post-thread-title').text('Edit Thread');
            }
            else{
                self.post = null;
                $('.post-thread-title').text('Post New Thread');
            }
            $('#new-thread-modal').modal();
        },
        insert_picture: function(url){
            $('#post-photo-list').append('<a class="lightbox-image-link" href="'+app_path+'/Public/Uploaded/'+url+'" data-lightbox="uploaded-photos" data-title="Click the right half of the image to move forward."><img class="lightbox-image" src="'+app_path+'/Public/Uploaded/th150x150_'+url+'" alt=""/><i class="lightbox-closebutton" onclick="remove_parent(event)"></i></a>');
            this.image_list.push(url);
        }
    }

    function open_edit_dialog(id, title, content, images){
        
    }
    
    function remove_parent(event){
        var item = $(event.currentTarget);
        item.parent().remove();
        event.preventDefault();
        return false;
    }
     
    function confirm_button(event){
        var self = event.currentTarget;
        $(self).hide();
        $(self).next().removeClass('hide').show();
        var timeout = window.setTimeout(function(){
            $(self).show();
            $(self).next().hide();
        }, '2000');
    }

    function Post(id, title, content, user_id, user_name, time, is_event, comment_count, can_edit, has_more, event_time, is_closed, signed_up){
        this.id = id;
        this.title = ko.observable(title);
        this.content = ko.observable(content);
        this.user_id = user_id;
        this.user_name = user_name;
        this.time = ko.observable(time);
        this.is_event = ko.observable(is_event);
        this.comment_count = comment_count;
        this.can_edit = can_edit;
        this.has_more = ko.observable(has_more);
        this.event_time = ko.observable(event_time);
        this.is_closed = ko.observable(is_closed);
        this.signed_up = ko.observable(signed_up);
        if(is_closed == undefined)is_closed(0);
        if(signed_up == undefined)signed_up(0);
        
        var self = this;
        this.edit = function (){
            $.get(app_path+'/Post/get/id/'+self.id, function(result){
                edit_dialog.open(self, result.id, result.title, result.content, result.images, result.is_event, result.event_time);
            },'json');
        }
        
        this.load_more = function(){
            $.get(app_path+'/Post/load_more/id/'+self.id, function(result){
                self.content(result);
                self.has_more(0);
            });
        }
        
        this.update = function(title, content, time, is_event, event_time){
            self.title(title);
            self.content(content);
            self.time(time);
            self.is_event(is_event);
            self.event_time(event_time);
        }
        
        this.close = function(closed){
            closed = 1-self.is_closed();
            $.get(app_path+'/Post/close_post/id/'+self.id+'/closed/'+closed, function(result){
                if(result == 'ok'){
                    self.is_closed(closed);
                }
            });
        }
    }
     
    function ViewModel(){
        this.posts = ko.observableArray();
        this.comment_id = ko.observable(0);
        this.signup_id = ko.observable(0);
        this.expand_id = ko.observable(0);
        this.expand_content = ko.observable();
        this.comment_text = ko.observable();
        this.comments = ko.observableArray();
        var self = this;
        
        for(var i in posts){
            var p = posts[i];
            this.posts.push(new Post(p.id, p.title, p.content, p.user_id, p.user_name, p.publish_time, p.is_event, p.comment_count, p.can_edit, p.has_more, p.event_time, p.is_closed, p.signed_up));
        }    
        
        this.view_comments = function(post){
            self.comment_id(post.id);
            self.comments.removeAll();
            $.get(app_path+'/Post/load_comments/id/'+post.id, function(result){
                for(var i in result){
                    self.comments.push(result[i]);
                }
            }, 'json');
            $('.fileupload2').fileupload({
                dataType: 'json',
                done: function (e, data) {
                    $('.comment-photo-list').append('<a class="lightbox-image-link comment-uploaded" data="'+data.result.url+'" href="'+app_path+'/Public/Uploaded/'+data.result.url+'" data-lightbox="comment-uploaded-photos" data-title="Click the right half of the image to move forward."><img class="lightbox-image" src="'+app_path+'/Public/Uploaded/th150x150_'+data.result.url+'" alt=""/><i class="lightbox-closebutton" onclick="remove_parent(event)"></i></a>');
                }
            });
            $('.post-comment-button').click(function(){
                var content = $('.comment-content').val();
                var images_el = $('.comment-uploaded');
                var photos = [];
                for(var i=0;i<images_el.length;i++){
                    var url = $(images_el[i]).attr('data');
                    photos.push(url);
                }
                $.post(app_path+'/Post/add_comment', {
                    content: content,
                    images: photos.join(','),
                    post_id: post.id
                }, function(result){
                    self.comments.push(result);
                    $('.comment-content').val('');
                    $('.comment-uploaded').empty();
                }, 'json');
            });
        };
        
        this.signup = function(post){
            self.signup_id(post.id);
            $('.confirm-signup-button').click(function(){
                var comment = $('.signup-comment-content').val();
                var slots = $('.signup-number-of-slots').val();
                $.post(app_path+'/Post/signup', {
                    'post_id': post.id,
                    'comment': comment,
                    'slots': slots
                }, function(){
                    post.signed_up(1);
                    self.signup_id(0);
                });
            });
        };
        
        this.cancel_signup = function(post){
            $.post(app_path+'/Post/signup', {
                'post_id': post.id,
                'cancel': 1
            }, function(){
                post.signed_up(0);
            });
        }
        
        this.load_more = function(post){
            $.get(app_path+'/Post/load_more/id/'+post.id, function(result){
                self.expand_content(result);
                self.expand_id(post.id);
            });
        }
        
        this.delete_post = function(post){
            $.get(app_path+'/Post/ajax_delete/id/'+post.id, function(result){
                self.posts.remove(post);
            });
        }
    }
    var viewModel = new ViewModel();
    ko.applyBindings(viewModel, document.getElementById('timeline-view'));

     