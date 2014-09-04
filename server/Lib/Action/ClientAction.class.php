<?php
// ajax calls by the client

class ClientAction extends Action {
    public function sections(){
        $sections = O('section')->select();
        
        echo json_encode($sections);
    }
    
    public function posts($section_id, $page=1){
        $posts = O('post')->with('section_id', $section_id)->attach('user', 'user_id', 'fullname')->select();
        for($i=0;$i<count($posts);$i++){
            $posts[$i]['content'] = mb_substr($posts[$i]['content'], 0, 130, 'utf-8');
        }
        
        echo json_encode($posts);
    }

    public function events(){

        if(isset($_GET['type']) && $_GET['type']=='my'){
            $user_id = intval(user('id'));
            $extra_sql = " and id in (select post_id from signup where user_id=$user_id)";
        }
        $current_time = date('Y-m-d');
        $sql = "select * from post where is_event=1 and event_time>'$current_time' and is_enabled=1 $extra_sql order by event_time limit 20";
        $posts = O()->query($sql);

        for($i=0;$i<count($posts);$i++){
            $posts[$i]['content'] = mb_substr($posts[$i]['content'], 0, 130, 'utf-8');
        }
        
        echo json_encode($posts);
    }

    
    public function post($id){
        $post = O('post')->find($id);
        $user = O('user')->find($post['user_id']);
        $post['user_name'] = $user['fullname'];
        
        // convert content and load images
        $content = nl2br($post['content']);
        if(!empty($post['images'])){
            $images = explode(',', $post['images']);
            foreach($images as $image){
                $content .= '<a class="lightbox-image-link" href="#/image/'.$image.'" data-lightbox="showcase-photos" data-title=""><img class="lightbox-image" src="'.__APP__.'/Public/Uploaded/th150x150_'.$image.'" alt=""/></a>';
            }
        }
        $post['content'] = $content;
        
        // load all the comments
        $comments = O('comment')->with('post_id', $id)->attach('user', 'user_id', 'fullname')->select();
        for($i=0;$i<count($comments);$i++){
            if(!empty($comments[$i]['images'])){
                $comments[$i]['content'] .= '<br/>';
                $images = explode(',', $comments[$i]['images']);
                foreach($images as $image){
                    $comments[$i]['content'] .= '<a class="lightbox-image-link" href="#/image/'.$image.'" data-lightbox="showcase-photos" data-title=""><img class="lightbox-image" src="'.__APP__.'/Public/Uploaded/th150x150_'.$image.'" alt=""/></a>';
                }
            }
        }
        $post['comments'] = $comments;
        
        if(user()){
            $post['rsvped'] = O('signup')->with('post_id', $id)
                                         ->with('user_id', user('id'))->count();
        }
        
        echo json_encode($post);
    }
}