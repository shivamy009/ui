
// const { json } = require('express');
let Blog=require('../model/blogModel')
let User=require('../model/userModel')
let Notification=require('../model/notificationModel')
let Comment=require('../model/commentModel')

const deleteComments=(_id)=>{
    Comment.findOneAndDelete({_id})
    .then(comment=>{
        if(comment.parent){
            Comment.findOneAndUpdate({_id:comment.parent},{$pull:{children:_id}})
            .then(data=>console.log("comment deleted from parent"))
            .catch(err=>console.log(err))
        }
        Notification.findOneAndDelete({comment:_id}).then(notification=>console.log("comment notification deleted"))

        Notification.findOneAndUpdate({reply:_id},{$unset:{reply:1}}).then(notification=>console.log('reply notification deleted'))

        Blog.findOneAndUpdate({_id:comment.blog_id},{$pull:{comments:_id},$inc:{"activity.total_comments":-1},"activity.total_parent_comment":comment.parent ? 0:-1})
        .then(blog=>{
            if(comment.children.length){
                comment.children.map(replies=>{
                    deleteComments(replies)
                })
            }
        })
    })
    .catch(err=>{
        console.log(err.message)
    })
}


exports.latestBlog=async(req,res)=>{
    try{
        let maxlimit=5;
        let {page}=req.body
        let blog=  await Blog.find({draft:false}).populate("author","personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .limit(maxlimit)
           .sort({"publishedAt":-1})
           .select("blog_id title des banner activity tags publishedAt -_id ") 
           .skip((page-1)*maxlimit)
        //    console.log(blog)
        // let blog=  await Blog.find({draft:false}).populate("author")

           return res.status(200).json({
            success:true,
            message:"Data fetched successfully",
            blog
           })

    }catch(e){
        console.log(e)
       return res.status(400).json({
            success:false,
            message:"Something went wrong whilefetching data"
        })
    }


}

exports.allLatestBlogCount=async(req,res)=>{
   await Blog.countDocuments({draft:false})
    .then(count=>{
        return res.status(200).json({totalDocs:count})
    })
    .catch(err=>{
        console.log(err)
        return res.status(500).json({err:err.message})
    })

}

exports.trendingBlog=async(req,res)=>{
    try{
        let blog=  await Blog.find({draft:false}).populate("author","personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .limit(5)
        .sort({"activity.total_reads":-1,"activity.likes":-1,"publishedAt":-1})
        .select("blog_id title publishedAt -_id")
        return res.status(200).json({
            success:true,
            message:"Data fetched successfully",
            blog
           })

    }catch(e){
        console.log(e)
        return res.status(400).json({
            success:false,
            message:"Something went wrong whilefetching data"
        })
    }

}

exports.searchBlog=async(req,res)=>{
    try{
      let {tag,page,query,author,limit,eliminate_blog}=req.body
    //   console.log(tag)
    
    
    let findQuery; 
    // console.log(tag)
    if(tag){
         tag=tag.toLowerCase()
         findQuery={tags:tag,draft:false,blog_id:{$ne:eliminate_blog}} 
        }   else if(query){
         query=query.toLowerCase()
         findQuery={draft:false,title:new RegExp(query,'i')}
     }else if(author){
        findQuery={author,draft:false}
     }
     let maxLimit=limit ? limit :2;
    let blog= await Blog.find(findQuery)
     .populate("author","personal_info.profile_img personal_info.username personal_info.fullname -_id")
     .sort({"publishedAt":-1})
     .select("blog_id title des banner activity tags publishedAt -_id ") 
     .skip((page-1)*maxLimit)
     .limit(maxLimit)
     
     return res.status(200).json({
        success:true,
        message:"Data fetched successfully",
        blog
       })
    }
    catch(e){
        console.log(e)
        return res.status(400).json({
             success:false,
             message:"Something went wrong whilefetching data"
         })
    }
}

exports.searchBlogCount=async(req,res)=>{
   
       let {tag,query,author}=req.body
       let findQuery; 
       if(tag){
            tag=tag.toLowerCase()
            findQuery={tags:tag,draft:false} 
           }   else if(query){
            query=query.toLowerCase()
            findQuery={draft:false,title:new RegExp(query,'i')}
   
        }else if(author){
            findQuery={author,draft:false}
         }

     await Blog.countDocuments(findQuery)
       .then(count=>{
        return res.status(200).json({totalDocs:count})
       }) 
       .catch(err=>{
        console.log(err.message)
        return res.status(400).json({
            err:err.message
        })
       })
    
}

exports.getProfile=async(req,res)=>{
    let {username}=req.body;
    User.find({"personal_info.username":username})
    .select("-personal_info.password -updatedAt -blogs")
    .then(user=>{
        return res.status(200).json(user)
    })
    .catch(err=>{
        return res.status(500).json({err:err.message})
    })
}

exports.UpdateProfileimg=(req,res)=>{
        let {url}=req.body
        User.findOneAndUpdate({_id:req.user.id},{"personal_info.profile_img":url})
        .then(()=>{
            return res.status(200).json({profile_img:url})
        })
        .catch(err=>{
            return res.status(403).json({error:err.message})
        })
}

exports.UpdateProfile=(req,res)=>{
       let {username,bio,social_links}=req.body
       let bioLimit=150;

       if(username.length<3){
        return res.status(403).json({error:"Username must be at least 3 letter long"})

       }
       if(bio.length>bioLimit){
        return res.status(403).json({error:"Bio shoud not more than 150 word"})

       }

       let socialLinkArr=Object.keys(social_links)
       try{

        for(let i=0;i<socialLinkArr.length;i++){
            if(social_links[socialLinkArr[i]].length){
                let hostname=new URL(social_links[socialLinkArr[i]]).hostname

                if(!hostname.includes(`${socialLinkArr[i]}.com`) && socialLinkArr[i]!='website'){
                    return res.status(403).json({error:`${socialLinkArr[i]} link is invalid you must enter full link`})
                }
            }
        }

       }
       catch(err){
        return res.status(500).json({error:"You must provide full social links"})
      
       }

       let updateObj={
        "personal_info.username":username,
        "personal_info.bio":bio,
       social_links
       }

       User.findByIdAndUpdate({_id:req.user.id},updateObj,{
        runValidators:true
       })
       .then(()=>{
        return res.status(200).json({username})
       })
       .catch(err=>{
        if(err.code==11000){
            return res.status(403).json({error:"Username is already taken"})
        }
        return res.status(500).json({error:err.message})

       })

}

exports.getBlog=async(req,res)=>{
       let {blog_id,draft,mode}=req.body
       let incrementVal= mode != 'edit' ? 1 :0;
       Blog.findOneAndUpdate({blog_id},{$inc:{"activity.total_reads":incrementVal}})
       .populate("author","personal_info.fullname personal_info.username personal_info.profile_img")
       .select("title des content banner activity publishedAt blog_id tags")
       .then(blog=>{
        User.findOneAndUpdate({"personal_info.username":blog.author.personal_info.username},{
            $inc:{"account_info.total_reads":incrementVal}
        })
        .catch(err=>{
            return res.status(400).json({err:err.message})
        })

        if(blog.draft && !draft){
            return res.status(500).json({err:"you can not access draft blog"})
        }
        return res.status(200).json({blog})
       })
       .catch(err=>{
        res.status(500).json({err:err.message})
       })

       
}
exports.likepost=(req,res)=>{
    let user_id=req.user.id;
    let {_id,islikebyuser}=req.body
    let incrementalVal=!islikebyuser ? 1:-1;
    Blog.findOneAndUpdate({_id},{$inc:{"activity.total_likes":incrementalVal}})
    .then(blog=>{
        if(!islikebyuser){
            let like=new Notification({
                type:"like",
                blog:_id,
                notification_for:blog.author,
                user:user_id
            })

            like.save().then(notification=>{
                return res.status(200).json({liked_by_user:true})
            })
        }
        else{
            Notification.findOneAndDelete({user:user_id,blog:_id,type:"like"})
            .then(data=>{
                return res.status(200).json({liked_by_user:false})
            })
             .catch(err=>{
                return res.status(500).json({error:err.message})
             })
        }
    })
}

exports.isLikebyuser=(req,res)=>{
    let user_id=req.user.id;
    let {_id}=req.body
    Notification.exists({user:user_id,type:"like",blog:_id})
    .then(result=>{
        return res.status(200).json({result})
    })
    .catch(err=>{
        return res.status(400).json({err:err.message})
    })
 
}

exports.Addcomment=(req,res)=>{
    let user_id=req.user.id;

    let{_id,comment,blog_author,replying_to,notification_id}=req.body
    if(!comment.length){
        return res.status(403).json({err:"write something to comment"})

    }
    // creating a comment
    let commentObj= {
        blog_id:_id,blog_author,comment,commented_by:user_id
    }
    if(replying_to){
        commentObj.parent=replying_to;
        commentObj.isReply=true;
    }

    
  new Comment(commentObj).save().then(async commentfile=>{
        let {comment,commentedAt,children}=commentfile
        Blog.findOneAndUpdate({_id},{$push:{"comments":commentfile._id},$inc:{"activity.total_comments":1,"activity.total_parent_comments": replying_to ? 0:1},})
        .then(blog=>{
            console.log("New Comment created")
        })

        let notificationObj={
            type:replying_to ? "reply":"comment",
            blog:_id,
            notification_for:blog_author,
            user:user_id,
            comment:commentfile._id
        }

        if(replying_to){
            notificationObj.replied_on_comment=replying_to
            await Comment.findOneAndUpdate({_id:replying_to},{$push:{children:commentfile._id}})
            .then(replyinfTocommentDoc=>{
                notificationObj.notification_for=replyinfTocommentDoc.commented_by
            })
            if(notification_id){
                Notification.findOneAndUpdate({_id:notification_id},{reply:commentfile._id})
                .then(notification=>{
                    console.log("Notification updated")
                })
            }
            
        }

        new Notification(notificationObj).save().then(notification=>console.log("new notification created"))

        return res.status(200).json({
            comment,commentedAt,_id:commentfile._id,user_id,children
        })
        

    })

}

exports.getBlogComment=(req,res)=>{
    let {blog_id,skip}=req.body
    // console.log(blog_id)
    let maxLimit=5;
    Comment.find({blog_id,isReply:false})
    .populate("commented_by","personal_info.username personal_info.fullname personal_info.profile_img")
    .skip(skip)
    .limit(maxLimit)
    .sort({
        'commentedAt':-1
    })
    .then(comment=>{
        res.status(200).json(comment)
    })
    .catch(err=>{
        console.log(err.message)
        return res.status(500).json({err:err.message})
    })


}

exports.uploadData=async(req,res)=>{
    try{
        // console.log(req.user)
        //    res.send(req.body)
        let authorId=req.user.id;
        let {title,des,banner,tags,content,draft,id}=req.body

        if(!title){
            return res.status(400).json({
                success:false,
                message:"You must provide draft"
            })
        }
        if(!draft){
            if(!des || !banner || !tags ){
             return res.status(400).json({
                 success:false,
                 message:"All fields are required"
             })
         }
         if(!content.blocks.length){
                return res.status(400).json({
                    success:false,
                    message:"There must be some blog content to publish it"
                })
         
            }

        }
         tags=tags.map(tag=>
              tag.toLowerCase()
         )

          

          let blog_id=id || title.replace(/[^a-zA-Z0-9]/g,' ').replace(/\s+/g,"-").trim()+Math.floor(Math.random() * 1000)+200;
        //   console.log(blog_id)
        
        if(id){

            Blog.findOneAndUpdate({blog_id},{title,des,banner,content,tags,draft:draft ? draft:false})
            .then(()=>{
                return res.status(200).json({id:blog_id})
            })
            .catch(err=>{
                return res.status(500).json({err:err.message})
            })
        }else{

          const blog =await new Blog ({
            title,des,banner,tags,content,author:authorId,blog_id,draft:Boolean(draft)

        })
       
        blog.save();
        let increament=draft ? 0:1 ;

        await User.findOneAndUpdate({_id:authorId},{$inc:{"account_info.total_posts":increament},$push:{"blogs":blog._id}})

        return res.status(200).json({
            id:blog.blog_id
        })

         
        //  blog.save().then(blog=>{
        //        let increament=draft ? 0:1 ;
        //        console.log(blog._id)
        //         User.findOneAndUpdate({_id:authorId},{$inc:{"account_info.total_posts":increament},$push:{"blogs":blog._id}})
                
        // }).then(user=>{
        //     return res.status(200).json(
        //         {id:blog.blog_id}
        //     )
        // })
        }

    }catch(e){
      console.log(e)
      return res.status(400).json({
        success:false,
        message:"Something went wrong while creating blog database",

    }
)}
}

exports.getReply=(req,res)=>{
  let{_id,skip}=req.body
  let maxLimit=5;
  Comment.findOne({_id})
  .populate({
    path:"children",
    options:{
        limit:maxLimit,
        skip:skip,
        sort:{'commentedAt':-1}
    },
    populate:{
        path:'commented_by',
        select:"personal_info.profile_img personal_info.fullname personal_info.username"
    },
    select:"-blog_id -updatedAt"
  })
  .select("children")
  .then(doc=>{
    return res.status(200).json({replies:doc.children})
  })
  .catch(err=>{
    return res.status(403).json({error:err.message})
  })
}

 

exports.deleteComments=(req,res)=>{
    let user_id=req.user.id;
    let {_id}=req.body
 
    Comment.findOne({_id})
    .then(comment=>{
        if(user_id==comment.commented_by || user_id==comment.blog_author){
            deleteComments(_id)
            return res.status(200).json({status:'done'})

        }else{
            return res.status(403).json({error:"you can not delete this comment"})
        }
    })

}

exports.NewNotifiacation=(req,res)=>{
       let user_id=req.user.id;
       Notification.exists({"notification_for":user_id,seen:false,user:{$ne:user_id}})
       .then(result=>{
        if(result){
            return res.status(200).json({new_notification_available:true})
        }else{
            return res.status(200).json({new_notification_available:false})
            
        }
    })
    .catch(err=>{
        console.log(err.message)
        return res.status(500).json({error:err.message})

       })
}

exports.NOTIFIcations=(req,res)=>{
    let user_id=req.user.id;
    let{page,filter,deletedDocCount}=req.body
    let maxLimit=10;
    let findQuery={notification_for:user_id,user:{$ne:user_id}}
    let skipDocs=(page-1)*maxLimit;
    if(filter !='all'){
           findQuery.type=filter;

    }
    if(deletedDocCount){
        skipDocs-=deletedDocCount
    }

    Notification.find(findQuery)
    .skip(skipDocs)
    .limit(maxLimit)
    .populate("blog","title blog_id")
    .populate("user","personal_info.fullname personal_info.username personal_info.profile_img")
    .populate("comment","comment")
    .populate("replied_on_comment","comment")
    .populate("reply","comment")
    .sort({createdAt:-1})
    .select("createdAt type seen reply")
    .then(notifications=>{
        Notification.updateMany(findQuery,{seen:true})
        .skip(skipDocs)
        .limit(maxLimit)
        .then(()=>console.log("notification seen"))
        return res.status(200).json({notifications})
    })
    .catch(err=>{
        console.log(err.message)
        return res.status(500).json({error:err.message})
        
    })

}

exports.NOTIFicationCount=(req,res)=>{
    let user_id=req.user.id;
    let {filter}=req.body
    let findQuery={notification_for:user_id,user:{$ne:user_id}}
    if(filter !='all'){
        findQuery.type=filter;

 }
 Notification.countDocuments(findQuery)
 .then(count=>{
    return res.status(200).json({totalDocs:count})
 })
 .catch(err=>{
    return res.status(500).json({error:err.message})
 })
              
}

exports.UserWrittenBlog=(req,res)=>{
    let user_id=req.user.id
    let {page,draft,query,deletedDocCount}=req.body
    let maxLimit=4;
    let skipDocs=(page-1)*maxLimit;
    if(deletedDocCount){
           skipDocs -=deletedDocCount;
    }

    Blog.find({author:user_id,draft,title:new RegExp(query,'i')})
    .skip(skipDocs)
    .limit(maxLimit)
    .sort({publishedAt:-1})
    .select("title banner publishedAt blog_id activity des draft -_id")
    .then(blogs=>{
        return res.status(200).json({blogs})
    })
    .catch(err=>{
        return res.status(500).json({error:err.message})
    })


}

exports.UserWrittenBlogCount=(req,res)=>{
     let user_id=req.user.id
     let {draft,query}=req.body
     Blog.countDocuments({author:user_id,draft,title:new RegExp(query,'i')})
     .then(count=>{
        return res.status(200).json({totalDocs:count})
    })
    .catch(err=>{
        console.log(err)
        return res.status(500).json({error:err.message})

     })


}

exports.deleteBlog=(req,res)=>{
    let user_id=req.user.id
    let {blog_id}=req.body;
    Blog.findOneAndDelete({blog_id})
    .then(blog=>{
        Notification.deleteMany({blog:blog._id})
        .then(data=>console.log("Notification deleted"))
        Comment.deleteMany({blog:blog._id})
        .then(data=>console.log("Comment deleted"))

        User.findByIdAndUpdate({_id:user_id},{$pull:{blog:blog._id},$inc:{"account_info.total_posts":-1}})
        .then(user=>console.log("blog deleted"))

        return res.status(200).json({status:'done'})
    })
    .catch(err=>{
        return res.status(500).json({error:err.message})

    })

}
 

exports.searchUsers=async(req,res)=>{
    let {query}=req.body
    //   query=query.toLowerCase();
    User.find({"personal_info.username":new RegExp(query,'i')})
    .limit(50)
    .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
    .then(users=>{
        return res.status(200).json({users})
    })
    .catch(err=>{
        return res.status(500).json({err:err.message})
    })
}