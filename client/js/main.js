
    var boards = {};
    var threads = {};


    if (! "onhashchange" in window) {
        alert("Please upgrade your browser!");
    }

    function locationHashChanged() {
        if (location.hash === "#boards") {
            getBoards();
        }
        else if (location.hash.indexOf("#thread:") > -1 ){
            getPostsForThread(location.hash.split(":")[1]);
        }
        else if (location.hash.indexOf("#board:") > -1 ){
            showThreadsForBoard(location.hash.split(":")[1]);
        }
        else if (location.hash.indexOf("#new_thread:") > -1 ){
            loadNewThreadTemplate(location.hash.split(":")[1]);
        }
        else{
            document.getElementById("app").innerHTML = "404 page not found";
        }
    }

    window.onload = function (event) {
        if(location.hash === ''){
            location.hash = "#boards";
        } else {
            $(window).trigger('hashchange');
        }
    };

    window.onhashchange = locationHashChanged;
    var threadHtml = '';

    function getBoards() {
        var xmlhttp = new XMLHttpRequest();

        xmlhttp.open("GET", "http://127.0.0.1:8089/api?command=getBoards&api_key=d3c3f756aff00db5cb063765b828e87b");
        xmlhttp.send();

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                var resp = JSON.parse(xmlhttp.responseText);
                console.log(resp.Payload);
                
                threadHtml = '';
                document.getElementById("app").innerHTML = '<h1>Boards:</h1>'; 
                if( resp.Payload === null){
                    document.getElementById("app").innerHTML += '<p>No threads for this board</p>';
                    return;
                }
                for (var i = 0; i < resp.Payload.length; i++){
                    (function (i){
                        boards[resp.Payload[i].Id] = resp.Payload[i];
                        document.getElementById("app").innerHTML += '<a href="#board:'+resp.Payload[i].Id + '" class="board">' + resp.Payload[i].Name + '</a>';
                    })(i)
                }
            }
        }
    }

    function getPostsForThread(threadId){
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", "http://127.0.0.1:8089/api?command=getPostsForThread&api_key=d3c3f756aff00db5cb063765b828e87b&thread_id=" + threadId);
        xmlhttp.send();

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    var respPosts = JSON.parse(xmlhttp.responseText);
                    console.log(respPosts.Payload);
                    var threadHtml = '<h2>'+threads[threadId].Name +'</h2><p>Post body:</p><textarea rows="4" cols="50" id="newPostTextArea"></textarea><br/><p>Post attachment URL:</p><input id="newPostAttachUrlInp" type="text" /><input class="btn btn-primary" type="button" onclick="submitNewPost()" value="Submit post!"  /> <input class="btn" type="button" onclick="refreshPostsForThread()" value="Refresh Posts!"  />';
                    if( respPosts.Payload !== null){ //undef means there are no posts to this thread
                        for (var k = 0; k <  respPosts.Payload.length; k++){
                            console.log (respPosts.Payload[k]);

                            var attachmentUrlHtml = '';
                            if(respPosts.Payload[k].AttachmentUrl !== undefined && 
                               respPosts.Payload[k].AttachmentUrl !== '' && 
                               respPosts.Payload[k].AttachmentUrl !== 'null' && 
                               respPosts.Payload[k].AttachmentUrl !== null ){
                                attachmentUrlHtml = '</br><a href="' + respPosts.Payload[k].AttachmentUrl  + '">attachment</a>';
                            }

                            threadHtml += '<p class="postBox">'+ respPosts.Payload[k].Body + attachmentUrlHtml +'</p>';
                        }
                    }
                    document.getElementById("app").innerHTML = threadHtml; 
            }
                
        }
    }
    
    function refreshPostsForThread(){
        window.location.hash = window.location.hash; 
    }

    function submitNewPost(){
        var xmlhttp = new XMLHttpRequest();
        var threadId = location.hash.split(":")[1]; 
        attachmentUrl = document.getElementById('newPostAttachUrlInp').value;

        xmlhttp.open("GET", "http://localhost:8089/api?command=addPostToThread&api_key=d3c3f756aff00db5cb063765b828e87b&thread_id=" + threadId + 
                            "&thread_post_body=" + escape(document.getElementById('newPostTextArea').value) + "&attachment_url="+escape(attachmentUrl));
        xmlhttp.send();

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    var respPosts = JSON.parse(xmlhttp.responseText);
                    getPostsForThread(threadId)
            }
       } 
    }


    function showThreadsForBoard(){
        var boardId = location.hash.split(":")[1]; 

        document.getElementById("app").innerHTML = '<h1>'+ boards[boardId].Name +'</h1><h2>Threads:</h2> <br><a href="#new_thread:'+ boardId  +'" class="btn btn-primary">New Thread!</a><br/><br/>';
        var xmlhttp1 = new XMLHttpRequest();
        xmlhttp1.open("GET", "http://127.0.0.1:8089/api?command=getActiveThreadsForBoard&api_key=d3c3f756aff00db5cb063765b828e87b&board_id=" + boardId);
        xmlhttp1.send();
        xmlhttp1.onreadystatechange = function() {
            if (xmlhttp1.readyState == 4 && xmlhttp1.status == 200) {
                var respThreads = JSON.parse(xmlhttp1.responseText);
                if( respThreads.Payload === null){
                    document.getElementById("app").innerHTML += '<p>No threads for this board</p>';
                    return;
                }
                
                for (var k = 0; k <  respThreads.Payload.length; k++){
                    threads[respThreads.Payload[k].Id] =  respThreads.Payload[k]; 
                    document.getElementById("app").innerHTML += '<a href="#thread:'+respThreads.Payload[k].Id + '" class="thread" >' +respThreads.Payload[k].Name +' </a> (Posts:' 
                                                                + respThreads.Payload[k].PostCount  + ' Attachments: '+ respThreads.Payload[k].PostCountWithAttachment+')</br>';
                }
            }
        }
    }

    function loadNewThreadTemplate(){
        document.getElementById("app").innerHTML = '<p>Thread name:</p><textarea rows="4" cols="50" id="newThreadTextArea"></textarea><br/><p>Post content:</p><textarea rows="4" cols="50" id="newThreadPostTextArea"></textarea><br/><p>Post Url:</p><input id="newPostAttachUrlInp" type="text" /><br/><input class="btn btn-primary" type="button" onclick="submitNewThread()" value="Submit Thread!"  />';

    }

    function submitNewThread(){
        boardId = location.hash.split(":")[1];
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", "http://localhost:8089/api?command=addThread&api_key=d3c3f756aff00db5cb063765b828e87b&board_id=" +boardId +"&thread_name="+ escape(document.getElementById('newThreadTextArea').value) );
        
        xmlhttp.send();

        xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                        var addThreadResp = JSON.parse(xmlhttp.responseText);
                        threads[addThreadResp.Payload.Id] = addThreadResp.Payload;
                        var xmlhttp1 = new XMLHttpRequest();
                        xmlhttp1.open("GET", "http://localhost:8089/api?command=addPostToThread&api_key=d3c3f756aff00db5cb063765b828e87b&thread_id=" + addThreadResp.Payload.Id +
                            "&thread_post_body=" + escape(document.getElementById('newThreadPostTextArea').value) + "&attachment_url="+escape(document.getElementById('newPostAttachUrlInp').value));
                        xmlhttp1.send();
                        xmlhttp1.onreadystatechange = function() {
                            if (xmlhttp1.readyState == 4 && xmlhttp1.status == 200) {
                                location.hash = "thread:" + addThreadResp.Payload.Id;
                            }
                }   
            }
        }
    }
