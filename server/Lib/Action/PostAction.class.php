<?php

class PostAction extends Action{

   
    // ajax apis

    private function _add(){

    	$data = array(
            'title' => $_POST['title'],
            'user_id' => user('id'),
            'publish_time' => date('Y-m-d H:i:s'),
            'is_event' => $_POST['is_event']?1:0,
            'signup_slots' => $_POST['signup_slots'],
            'images' => $_POST['images'],
        );
        if(isset($_POST['section_id'])){
            $data['section_id'] = $_POST['section_id'];
        }
//        if(is_array($_POST['images'])){
//            $data['images'] = implode(',', $_POST['images']);
//        }
        $content = preg_replace('!(https?://[a-z0-9_./?=&-]+)!i', '<a href="$1">$1</a> ', $_POST['content']." "); 
        $content = preg_replace('!(\S+@\S+\.\S+)!i', '<a href="mailto:$1">$1</a>', $content." "); 
        $data['content'] = $content;

        if(!empty($_POST['event_time'])){
            $data['event_time'] = $_POST['event_time'];
        }
        
        // if id specified, do save operation
    	if(!isset($_POST['id']) || $_POST['id']==0){
            $new_post_id = O('post')->add($data);
            return $new_post_id;
        }
        else{
            $data['id'] = $_POST['id'];
            $new_post_id = O('post')->data($data)->save();
            return $_POST['id'];
        }
    	
    }
    
    // this is not only add - it also handles edit-save
    public function ajax_add(){
        $new_id = $this->_add();
        $post = O('post')->find($new_id);
        echo json_encode($post);
    }
    
    public function ajax_delete(){
        O('post')->with('id', $_GET['id'])->delete();
        echo json_encode(array('ret'=>'ok'));
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
    
    public function get($id){
        $post = O('post')->find($id);
        echo json_encode($post);
    }
    
    public function load_more($id){
        $post = O('post')->find($id);
        
        $content = nl2br($post['content']);
        if(!empty($post['images'])){
            $images = explode(',', $post['images']);
            foreach($images as $image){
                $content .= '<a class="lightbox-image-link" href="'.__APP__.'/Public/Uploaded/'.$image.'" data-lightbox="showcase-photos" data-title=""><img class="lightbox-image" src="'.__APP__.'/Public/Uploaded/th150x150_'.$image.'" alt=""/></a>';
            }
        }
        
        echo $content;
    }
    
    public function load_comments($id){
        $comments = O('comment')->with('post_id', $id)->attach('user', 'user_id', 'fullname')->select();
        for($i=0;$i<count($comments);$i++){
            if(!empty($comments[$i]['images'])){
                $comments[$i]['image_list'] = explode(',', $comments[$i]['images']);
            }
            else{
            $comments[$i]['image_list'] = array();
            }
        }
        
        echo json_encode($comments);
    }
    
    public function add_comment(){
        $comment_id = O('comment')->add(array(
            'content' => $_POST['content'],
            'post_id' => $_POST['post_id'],
            'images' => $_POST['images'],
            'publish_time' => date('Y-m-d H:i:s'),
            'user_id' => user('id'),
        ));
        if($comment_id){
            $comment = O('comment')->find($comment_id);
            echo json_encode($comment);
        }
        else{
            echo '{}';
        }
    }
    
    public function close_post($id, $closed=1){
        O('Post')->data(array(
            'id' => $id,
            'is_closed' => $closed
        ))->save();
        
        echo json_encode(array('ret'=>'ok'));
    }
    
    // sign up an event when post[cancel] != 1, otherwise cancel signup an event.
    public function signup(){
        if(!is_numeric($_POST['post_id']))return;
        O('signup')->with('post_id', $_POST['post_id'])->delete();
        if(!isset($_POST['cancel'])){
            O('signup')->add(array(
                'post_id' => $_POST['post_id'],
                'comment' => $_POST['comment'],
                'slots' => $_POST['slots'],
                'user_id' => user('id')
            ));
        }
        echo 'ok';
        
    }
    
    public function upload(){
        $image = OO('Uploader')->imageOnly()->thumb('150x150')->upload();
        
        if(!$image->error()){
            echo json_encode(array('url'=>$image->url()));
        }
        else{
            echo $image->error();
        }
    }

}