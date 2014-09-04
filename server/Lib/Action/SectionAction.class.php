<?php

class SectionAction extends Action{
    public function test(){
        Log::record('error');
        echo C('APP_DEBUG').'debugging';
    }
    
    public function show(){
    	$sections = O('section')->select();

    	$this->assign('sections', json_encode($sections));
        $this->display();
    }
    
    public function view(){
        $posts = $this->select_posts($_GET['section_id']);
        $section = O('section')->find($_GET['section_id']);
        $section_name = $section['name'];

        $this->assign('posts', $posts);
        $this->assign('section_name', $section_name);
        $this->display();
    }

    // ajax apis

    public function add(){
    	$new_section_id = O('section')->add(array(
    			'name' => $_POST['name'],
    			'anybody_can_post' => $_POST['anybody_can_post'],
    			'has_events' => $_POST['has_events']
    		));

    	echo $new_section_id;
    }

    public function save(){
    	O('section')->save(array(
    			'id' => $_POST['id'],
    			'name' => $_POST['name'],
    			'anybody_can_post' => $_POST['anybody_can_post'],
    			'has_events' => $_POST['has_events']
    		));

    	echo 1;
    }

    public function delete(){
    	O('section')->where(array('id'=>$_POST['id']))->delete();

    	echo 1;
    }
    
    private function select_posts($section_id, $page=1){
        $posts = O('post')->with('section_id', $section_id)->with('enabled', 1)
                    ->with("(is_closed=0 or user_id=".user('id').")")
                    ->fetch('comment')->order('id desc')->select();
                    
        for($i=0;$i<count($posts);$i++){
            // show part of content instead of full
            if(mb_strlen($posts[$i]['content'])>130){
                $posts[$i]['has_more'] = 1;
            }
            else{
                $posts[$i]['has_more'] = 0;
            }
            $posts[$i]['content'] = mb_substr($posts[$i]['content'], 0, 130, 'utf-8');
            
            // get the comment count
            $posts[$i]['comment_count'] = O('comment')->with('post_id', $posts[$i]['id'])->count();

            // check whether the user can edit
            if(user('id') == $posts[$i]['user_id'] || user('is_admin')){
                $posts[$i]['can_edit'] = 1;
            }
            else{
                $posts[$i]['can_edit'] = 0;
            }
            
            //check whether user has signed-up this posts
            $posts[$i]['signed_up'] = O('signup')->with('post_id', $posts[$i]['id'])->with('user_id', user('id'))->count();
        }
        
        return $posts;
    }

}