<?php

class UserAction extends Action{


    public function login_action(){
        $user = O('user')->with('username', $_POST['username'])
                             ->with('password', md5(C('MD5_SALT').$_POST['password']))
                             ->find();
                             
        if($user){
            $_SESSION['login_user'] = $user;
            $this->redirect('Section/show');
        }
        else{
            flash('User ID and Password do not match');
            $this->redirect('User/login');
            return;
        }
    }
    
    public function ajax_login(){
        $user = O('user')->with('username', $_POST['username'])
                             ->with('password', md5(C('MD5_SALT').$_POST['password']))
                             ->find();
                             
        if($user){
            // writeback and return uid
            $uid = uniqid() . uniqid();
            O('user')->with('id', $user['id'])->data(array('login_token'=>$uid))->save();
            echo json_encode(array('uid'=>$uid));
        }
        else{
            echo json_encode(array('error'=>'Login Failed'));
        }
    }
    
    public function new_user(){
        // check if user already exist
        $existing_count = O('user')->with('username', $_POST['username'])->count();
        if($existing_count > 0){
            flash('User already exists');
            $this->redirect('User/register');
            return;
        }
        
        $new_id = O('user')->add(array(
            'fullname' => $_POST['fullname'],
            'username' => $_POST['username'],
            'password' => md5(C('MD5_SALT') . $_POST['password']),
        ));
        
        if($new_id){
            $_SESSION['login_user'] = O('user')->find($new_id);
            $this->redirect('Section/show');
        }
    }
    
    public function logout(){
        unset($_SESSION['login_user']);
        $this->redirect('User/login');
    }


}