var base_url = 'http://wangyu.scripts.mit.edu/cssa';

angular.module('starter.services', [])

/**
 * A simple example service that returns some data.
 */
.factory('Util', function($rootScope, $http){
    var service = {
      uid: '',

      signin: function(username, password){
        var self = this;
        $http.post(base_url+'/User/ajax_login', {
          'username': username,
          'password': password
        }).success(function(ret){
          if(ret.error === undefined){
            self.uid = ret.uid;
            localStorage['cssa_uid'] = ret.uid;
            $rootScope.$broadcast('login.success');
          }
          else{
            $rootScope.$broadcast('login.error.password');
          }
        }).error(function(){
          $rootScope.$broadcast('login.error.connection');
        });
      },

      is_signedin: function(){
        if(this.uid !== '')
          return true;
        else
          return false;
      },

      get_user_uid: function(){
        return this.uid;
      },

      get_image_base_url: function(){
        return base_url+'/Public/Uploaded/';
      }
    };

    if(localStorage['cssa_uid']!==undefined){
      service.uid = localStorage['cssa_uid'];
      $rootScope.$broadcast('login.success');
    }

    return service;
})

.factory('Section', function($rootScope, $http) {
    var service = {
    sections: [],

    sync: function(){
      var self = this;
      $http.get(base_url+'/Client/sections').success(function(data){
        self.sections = data;
        $rootScope.$broadcast('section.update');
      });
    },

    all: function(){
      // $rootScope.$broadcast('section.update');
      return this.sections;
    },

    get: function(id) {
        for(var i in this.sections){
          if(this.sections[i].id == id){
            return this.sections[i];
          }
        }
        return null;
      }
    };
    return service;
})

.factory('Events', function($rootScope, $http, Util) {
    var service = {
      all_events: [],
      my_events: [],

      sync: function(my_events){
        var self = this;
        if(my_events===true){
          extra_url = '/type/my/uid/'+Util.get_user_uid();
        }
        else{
          extra_url = '';
        }
        $http.get(base_url+'/Client/events'+extra_url).success(function(data){
          if(my_events===true){
            self.my_events = data;
          }
          else{
            self.all_events = data;
          }
          $rootScope.$broadcast('events.update');
        });
      },

      all: function(my_events){
        var self = this;
        if(my_events === true){
          return self.my_events;
        }
        else{
          return self.all_events;
        }
      }
    };
    return service;
})

.factory('Post', function($rootScope, $http, Util) {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var service = {
    posts: [],

    sync: function(section_id){
      var self = this;
      $http.get(base_url+'/Client/posts/section_id/'+section_id).success(function(data){
        for(var i in data){
          data[i].from_now = moment(data[i].publish_time).fromNow();
          self.posts[data[i].id] = data[i];
        }
        $rootScope.$broadcast('post.update');
      });
    },

    load: function(post_id){
      var self = this;
      if(Util.is_signedin()){
        var url_uid_part = '/uid/'+Util.get_user_uid();
      }
      $http.get(base_url+'/Client/post/id/'+post_id+url_uid_part).success(function(data){
        if(data.event_time){
          data.event_date = data.event_time.split(' ')[0];  // this is mysql specific! get the date part of datetime
        }
        self.posts[data.id] = data;
        $rootScope.$broadcast('post.load');
      });
    },

    by_section: function(section_id){
      var self = this;
      var out = [];
      for(var i in self.posts){
        if(self.posts[i].section_id == section_id){
          out.push(self.posts[i]);
        }
      }
      return out;
    }, 

    get: function(id){
      return this.posts[id];
    },

    delete_post: function(id, callback){
      $http.get(base_url+'/Post/ajax_delete/id/'+id+'/uid/'+Util.get_user_uid()).success(function(result){
        callback();
        $rootScope.$broadcast('post.changed');
      });
    },

    add_post: function(post, callback){
      var self = this;
      post.id = Util.get_user_uid();
      post.is_event = post.is_event?'1':'0';
      $http.post(base_url+'/Post/ajax_add', post).success(function(data){
        if(!(data.id in self.posts)){
          self.posts.unshift(data);
        }
        callback(data);
      });
    },

    add_comment: function(comment, callback){
      var self = this;
      comment.uid = Util.get_user_uid();
      $http.post(base_url+'/Post/add_comment', comment).success(function(data){
        callback(data);
      });
    },

    close_post: function(id, closed, callback){
      var self = this;
      var url_uid_part = '/uid/'+Util.get_user_uid();
      $http.get(base_url+'/Post/close_post/id/'+id+'/closed/'+closed+url_uid_part).success(function(result){
        callback();
        // $rootScope.$broadcast('post.changed');
      });
    },

    send_rsvp: function(rsvp, callback){
      var self = this;
      rsvp.uid = Util.get_user_uid();
      $http.post(base_url+'/Post/signup', rsvp).success(function(data){
        callback(data);
      });
    },

    cancel_rsvp: function(id, callback){
      var self = this;
      rsvp = {
        cancel: 1,
        post_id: id,
        uid: Util.get_user_uid()
      };
      $http.post(base_url+'/Post/signup', rsvp).success(function(data){
        callback(data);
      });
    }
  };
  return service;
});
