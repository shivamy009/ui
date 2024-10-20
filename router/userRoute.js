const express = require('express');
const { Signup, signIn, changePassword } = require('../controller/userController');
const { requireSignin } = require('../middleware/authMiddleware');
const { uploadData, latestBlog, trendingBlog, searchBlog, allLatestBlogCount, searchBlogCount, searchUsers, getProfile, getBlog, likepost, isLikebyuser, Addcomment, getBlogComment, getReply, deleteComments, UpdateProfileimg, UpdateProfile, NewNotifiacation, NOTIFIcations, NOTIFicationCount, UserWrittenBlog, UserWrittenBlogCount, deleteBlog } = require('../controller/blogController');
const router=express.Router();

router.post('/signup',Signup)
router.post('/signin',signIn)
router.post('/change-password',requireSignin,changePassword)
router.post('/update-profile-img',requireSignin,UpdateProfileimg)
router.post('/update-profile',requireSignin,UpdateProfile)
router.post('/create-blog',requireSignin,uploadData)
router.post('/user-written-blog',requireSignin,UserWrittenBlog)
router.post('/user-written-blog-count',requireSignin,UserWrittenBlogCount)
router.post('/latest-blogs',latestBlog)
router.post('/all-latest-blogs-count',allLatestBlogCount)
router.get('/tranding-blogs',trendingBlog)
router.post('/search-blogs',searchBlog)
router.post('/search-blogs-count',searchBlogCount)
router.post('/search-users',searchUsers)
router.post('/get-profile',getProfile)
router.post('/get-blog',getBlog)
router.post('/like-blog',requireSignin,likepost)
router.post('/isliked-by-user',requireSignin,isLikebyuser)
router.post('/add-comment',requireSignin,Addcomment)
router.post('/get-blog-comment',getBlogComment)
router.post('/get-replies',getReply)
router.post('/delete-comment',requireSignin,deleteComments)
router.get('/new-notification',requireSignin,NewNotifiacation)
router.post('/notifications',requireSignin,NOTIFIcations)
router.post('/all-notification-count',requireSignin,NOTIFicationCount)
router.post('/delete-blog',requireSignin,deleteBlog)



module.exports=router