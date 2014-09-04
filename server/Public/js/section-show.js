      
        app_path = '__APP__';
        
        
        
        // jquery confirm delete
        $(function(){
            $('.parent-hover-control').hide();
            $('.parent-hover-control').parent().hover(function(){
                $(this).find('.parent-hover-control').show();
            }, function(){
                $(this).find('.parent-hover-control').hide();
            });
        });
        
        function confirm_button(event){
            var self = event.currentTarget;
            $(self).hide();
            $(self).next().removeClass('hide').show();
            var timeout = window.setTimeout(function(){
                $(self).show();
                $(self).next().hide();
            }, '2000');
        }

        function Section(id, name, anybody_can_post, has_events){
            this.id = id;
            this.name = ko.observable(name);
            this.in_edit = ko.observable(false);
            this.has_events = ko.observable(has_events);
            this.anybody_can_post = ko.observable(anybody_can_post);

            var self = this;
            this.edit = function (){
                self.in_edit(true);
                self.old_name = self.name();
                self.old_has_events = self.has_events();
                self.old_anybody_can_post = self.anybody_can_post();
            }

            this.save = function(){
                var target_ui = event.currentTarget;
                $(target_ui).addClass('loading');
                if(self.id == 0){
                    $.post(app_path+'/Section/add', {'name':self.name(), 'has_events':self.has_events(), 'anybody_can_post':self.anybody_can_post()}, function(result){
                        if(!isNaN(result)){
                            self.id = result;
                            self.in_edit(false);
                        }
                    });
                }
                else{
                    $.post(app_path+'/Section/save', {'id': self.id,'name':self.name(),  'has_events':self.has_events(), 'anybody_can_post':self.anybody_can_post()}, function(result){
                        if(!isNaN(result)){
                            self.in_edit(false);
                        }
                    });
                }
            }

            this.discard_change = function(){
                self.in_edit(false);
                self.name(self.old_name);
                self.has_events(self.old_has_events);
                self.anybody_can_post(self.old_anybody_can_post);
            }
        }   // function Section

        function SectionViewModel(){
            this.sections = ko.observableArray();
            var self = this;

            for(var i in current_sections){
                var section = current_sections[i];
                self.sections.push(new Section(section.id, section.name, section.has_events, section.anybody_can_post));
            }

            this.new_section = function(){
                var section = new Section(0, '', '');
                section.in_edit(true);
                self.sections.push(section)
            }

            this.delete_section = function(section){
                var target_ui = event.currentTarget;
                $(target_ui).addClass('loading');
                $.post(app_path+'/Section/delete', {id:section.id} ,function(result){
                    self.sections.remove(section);
                });
            }

            this.section_discard_change = function(section){
                if(section.id == 0){
                    self.sections.remove(section);
                }
                else{
                    section.discard_change();
                }
            }
        }

        sectionViewModel = new SectionViewModel();
        ko.applyBindings(sectionViewModel, document.getElementById('section-view'));