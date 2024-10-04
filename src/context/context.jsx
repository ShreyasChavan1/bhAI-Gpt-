import { createContext, useState,useEffect } from "react";
import run from "../config/gemini";
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from "../lib/firebase";
import { doc , setDoc ,updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { arrayUnion } from "firebase/firestore";


export const Context = createContext();

const ContextProvider = (props) => {
//for generative Ai
    const [input,setInput] = useState("");
    const [recentPrompts ,setRecentPrompts] = useState("");
    const [prevPrompts,setPrevPrompts] = useState([]);
    const [showResult,setShowResult] = useState(false);
    const [loading,setLoading] = useState(false);
    const [resultData,setResultData] = useState("");
    

    //for login
    const [email,setEmail] = useState("");
    const [pass,setPass] = useState("");
//saving login cred
    const [user,setUser] = useState(false);
        useEffect(() => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
              setUser(user);
          });
          return () => {
            unsubscribe();
        };
      }, []);


    const onSent = async (prompt) =>{
        const message = prompt || input;

        if (!message.trim()) {
            return;
        }
        setResultData("");
        setLoading(true);
        setShowResult(true);
        setRecentPrompts(input);
       const responce =  await run(input);

       let responseArray = responce.split("**");
       let newResponse;
       for(let i=0;i<responseArray.length;i++){
        if(i===0 || i%2 !== 1){
            newResponse += responseArray[i];
        }else{
            newResponse += "<b>"+responseArray[i]+"</b>";
        }
       }
       let newResponse2 = newResponse.split("*").join("<br>");
       setResultData(newResponse2);

       try {
        const userDocRef = doc(db, "userChats", user.uid);

        await updateDoc(userDocRef, {
            chats: arrayUnion({
                prompt: message,
                response: newResponse2,
                timestamp: new Date(),
            }),
        });
        console.log("Chat appended successfully");
    } catch (error) {
        console.error("Error updating chat: ", error);
    }

       setLoading(false);
       setInput("");
    }
    
    
    

    const contextValue = {
        prevPrompts,
        setPrevPrompts,
        recentPrompts,
        setRecentPrompts,
        loading,
        showResult,
        resultData,
        onSent,
        input,
        setInput,

        user,
        setUser,
        email,
        setEmail,
        pass,
        setPass,

        // chathistory,
        // setChathistory
    }

    return (
        <Context.Provider value={contextValue}>
            {props.children}
        </Context.Provider>

    )
}
export default ContextProvider;