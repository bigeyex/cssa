<?php 


/* return attribute of current login user */
function user($attr=null, $value=null){
	// this deals with uid
	if(isset($_GET['uid']) || isset($_POST['uid'])){
        $uid = isset($_GET['uid'])?$_GET['uid']:$_POST['uid'];
        $user = O('user')->with('login_token', $uid)->find();
        if($user){
            $_SESSION['login_user'] = $user;
        }
    }
	
	
	
	if(!isset($_SESSION['login_user'])){
		return 0;
		return false;
	}
	if($attr === null){
		return true;
	}
	if($value === null){	// read user info
		return $_SESSION['login_user'][$attr];
	}
	else{					//write user info
		$_SESSION['login_user'][$attr] = $value;
	}
}