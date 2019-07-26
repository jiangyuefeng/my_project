$(function(){
    $("#file1").change(function () { 

        var fileReader = new FileReader(),  
        blobSlice = File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice,  
        file = document.getElementById("file1").files[0],  
        chunkSize = 2097152,  
        // read in chunks of 2MB  
        chunks = Math.ceil(file.size / chunkSize),  
        currentChunk = 0,  
        spark = new SparkMD5();  
        
        fileReader.onload = function(e) {   
            spark.appendBinary(e.target.result); // append binary string  
            currentChunk++;  
            if (currentChunk < chunks) {  
                loadNext();  
            }  
            else {   
                md5.innerHTML=spark.end();
                $("#upload").show();
                $("#text").html("");
            }  
        };  

    function loadNext() {  
        var start = currentChunk * chunkSize,  
            end = start + chunkSize >= file.size ? file.size : start + chunkSize;  

        fileReader.readAsBinaryString(blobSlice.call(file, start, end));  
    };  


        var file = document.getElementById('file1').files[0];
        if(!/audio\/\w+/.test(file.type)){ 
            $('#fileName').html("");
            $('#fileSize').html("");
            $("#icon").hide();
            alert("请确保文件为音频类型"); 
            return false; 
            
        }
        
        if (file) { 
            var fileSize = 0;
            if (file.size > 1024 * 1024)
                {
                    fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
                }
            else
                fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
            $("#icon").show();
            $('#fileName').html( file.name);
            $('#fileSize').html( fileSize);
            $("#transform").hide();
            $("#text").html("等待md5生成...");
        }
    })
});
//上传音频
$(function () {
    $("#upload").click(function () {
        var fd = new FormData();
        var file = document.getElementById('file1').files[0];
        uuid.innerHTML=uuid();
        //console.log(uuid());
        var mymd5=md5.innerHTML;
        console.log(mymd5);
        var myindex=uuid.innerHTML;
        //formdata数据
        fd.append("file",file);
        fd.append("md5",mymd5);
        fd.append("app_id","system");
        fd.append("app_secret","12345");
        fd.append("seq",myindex);
        console.log(fd.get("data"));
        $("#text").html("等待数据准备...");

        $.ajax({
            //上传服务器接口
            url: "http://10.128.2.67:20031/kaldiasr/vad",
            type: "POST",
            data: fd,
            async:true,
            contentType: false,
            processData: false,            
            xhr: function() { //用以显示上传进度  
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event){
                        var percent = Math.round(event.loaded / event.total * 100);
                        document.getElementById("progressNumber").innerHTML= percent.toString() + "%";
                        $("#upload").hide();
                    }, false);
                    
                }
                return xhr
                
            },
            
            success: function (data) {
            console.log(data);
            $("#transform").show();
            $("#text").html("");

            if (data.status == "true") {
                alert("上传成功！");
                
            }
            if (data.status == "error") {
                alert(data.msg);
            }
            },
            error: function () {
                alert("上传失败！");
            }

        })
    })    
});
//转写文字
$(function () {
    $("#transform").click(function () {
        //var myindex=uuid.innerHTML;
        //console.log(myindex);
        var post_data={
            "app_id":"system",
            "app_secret":"12345",
            "index":uuid.innerHTML
        }
        var post=JSON.stringify(post_data);
        var alltxt="";
        var c=setInterval(function(){test(c)},1000);
        function test(c){
            $.ajax({
                url: "http://10.128.2.67:20031/kaldiasr/packet",
                type: "POST",
                async:true,
                data:post,
                contentType: false,
                processData: false,            
                success: function (data) {
                    console.log(data);
                    if(data.info=="success"){
                        var txt1="";
                        for(i=0;i<data.vadresult.length;i++){
                            if(data.vadresult[i].Value.status==0){
                                txt1=txt1+data.vadresult[i].Value.result.hypotheses[0].transcript; 
                            }
                            else{
                                alert("状态出错")
                            }
                        }   
                        //console.log(txt1);
                        var txt=txt1.replace(/(^\s+)|(\s+$)/g,"").replace(/\s/g,"");
                        //console.log(txt);
                        alltxt=alltxt+"\n"+txt;
                        $("#text").html(alltxt);        
                        if(data.finish=="yes"){
                            alltxt="";
                            clearInterval(c); 
                        }
                    }
                    else{
                        alert(data.info);
                    }
                }        
            })    
        }

    })    
});

function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}




