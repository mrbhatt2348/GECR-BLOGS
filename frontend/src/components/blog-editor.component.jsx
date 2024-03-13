import {Link,useParams} from "react-router-dom"
import lightLogo from "../imgs/logo-light.png"
import darkLogo from "../imgs/logo-dark.png"
import AnimationWrapper from "../common/page-animation";
import lightBanner from "../imgs/blog banner light.png"
import darkBanner from "../imgs/blog banner dark.png"
import {uploadImage} from "../common/aws.jsx";
import { useContext, useEffect } from "react";
import {toast, Toaster} from'react-hot-toast';
import { EditorContext } from "../pages/editor.pages.jsx";
import EditorJS from "@editorjs/editorjs"
import {tools} from './tools.component'
import axios from "axios";
import { ThemeContext, UserContext } from "../App.jsx";
import {useNavigate} from "react-router-dom"


const BlogEditor = () => {
 let{blog, blog:{ title, banner, content, tags,des,draft}, setBlog, textEditor, setTextEditor,setEditorState}= useContext(EditorContext);

 let {userAuth: {access_token}}=useContext(UserContext)
 let {blog_id}=useParams();
 let navigate= useNavigate();

 let {theme} =useContext(ThemeContext)


//  useeffect
useEffect(()=>{
  if(!textEditor.isReady){
    setTextEditor( new EditorJS({
      holderId: "textEditor",
      data: Array.isArray(content)?content[0]:content,
      tools:tools,//to add more features to write
      placeholder:"Let's write an awesome story"
     }))
  }
   
},[])
 


 const handleBannerUpload =(e) =>{
    let img = e.target.files[0];

    // if theres an image then,, upload it to s3 and get the URL back
    if(img){

        let loadingToast=toast.loading("Uploading...")

        uploadImage(img).then((url)=>{

            // if got an url then set it to the banner img
            if(url){
              toast.dismiss(loadingToast);
              toast.success("Uploaded 👍");
                setBlog({...blog, banner: url});
              }
             })
             .catch(err=>{
               toast.dismiss(loadingToast);
               return toast.error(err);
             })
        }
  }
 const handleTitleKeyDown= (e)=>{
  if(e.KeyCode==13){//user has pressed enter key
    e.preventDefault();
  }
}

 const handleTitlechange =(e)=>{
  let input= e.target;
  input.style.height="auto";
  input.style.height= input.scrollHeight +"px";

  setBlog({...blog, title: input.value});
 }
 const handleError=(e)=>{
  let img= e.target;
  img.src=theme=="light"?lightBanner:darkBanner;

 }
 const handlePublish=()=>{
  if(!banner.length){
    return toast.error("Please upload a banner image")
  }
  if(!title.length){
    return toast.error("Please add a title")
  }

  if(textEditor.isReady){
    textEditor.save().then(data=>{
      if(data.blocks.length){
        setBlog({...blog, content: data});
        setEditorState("publish")
      }else{
        return toast.error("Please write some content before publishing")
      }
    })
    .catch((err)=>{
      console.log(err);
    })
  }
  
  }
const handleSaveDraft=(e)=>{
  if(e.target.className.includes('disable')){
    return;
  }

  if(!title.length){
    return toast.error("Title is required before saving it as a draft");
    }

  let loadingToast=toast.loading("Saving Draft....")

  e.target.classList.add('disable');//stoping the user to publish the blog twice 

if(textEditor.isReady){

  textEditor.save().then(content =>{

     let blogObj={
      title,banner,des,content,tags,draft: true
    }
  
  axios.post(import.meta.env.VITE_SERVER_DOMAIN+ "/create-blog",{...blogObj, id: blog_id},{
    headers:{
      'Authorization': `Bearer ${access_token}`
    }
  })
  .then(()=>{
    e.target.classList.remove('disable');
    toast.dismiss(loadingToast)
    toast.success("Saved!")
  
    setTimeout(()=>{
      navigate("/dashboard/blogs?tab=draft");
    },500)
  })
  .catch(({ response})=>{   
    e.target.classList.remove('disable');
    toast.dismiss(loadingToast)
  
    return toast.error(response.data.error);
  })
  })
}


}
 

  return (
    <>
      <nav className="navbar" >
        <Link to="/" className="flex-none w-10">
          <img src={theme == "light" ? darkLogo:lightLogo } alt="err"/>
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length? title:"New blog"}
            
        </p>

        <div className="flex gap-4 ml-auto">
            <button className="btn-dark py-2"
            onClick={handlePublish} >
                Publish
            </button>
            <button className="btn-light py-2" onClick={handleSaveDraft} >
                Save Draft
            </button>
        </div>

      </nav>
      <Toaster/> 
      <AnimationWrapper>
            <section>
                <div className="mx-auto mx-w-[900px] w-full ">

                    <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">

                        <label htmlFor="uploadBanner">
                            <img 
                            src={banner}
                            className="z-20"
                            onError={handleError}
                            />
                            <input
                            id="uploadBanner"
                            type="file"
                            accept="All Files" 
                            hidden
                            onChange={handleBannerUpload}
                            />
                        </label>

                    </div>
                    <textarea
                     defaultValue={title}
                      placeholder="Blog Title"
                      className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 bg-white"
                      onKeyDown={handleTitleKeyDown}
                      onChange={handleTitlechange}
                      >
                    </textarea>
                   <hr className="w-full opacity-10 my-5"/>

                   <div id="textEditor" className=" font-gelasio" >

                   </div>

                </div>
            </section>
      </AnimationWrapper>
    
    </>
  )
}

export default BlogEditor;