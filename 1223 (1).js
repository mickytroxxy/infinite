var searchKeyArray=[];
var recentArray=[];
var activeKeyRef;
var serverArray = [];
var processing = false;
var loginStatus = window.localStorage.getItem("loginStatus");
var userId = window.localStorage.getItem("userId");
var lastKey = window.localStorage.getItem("lastKey");
var baseUrl = null;
var isSearchDivVisible = true;
var deviceName = null;
function deviceReady(){
    isLoggedIn();
    StatusBar.backgroundColorByHexString('#1b2735');
    deviceName = device.manufacturer;
    //baseUrl = window.localStorage.getItem("baseUrl");
    if(checkConnection()=='WiFi connection'){
       baseUrl = "http://192.168.0.185:3000";
    }else if(checkConnection()=='No network connection'){
       baseUrl = "http://196.61.18.205:3000";
    }else{
       baseUrl = "http://196.61.18.205:3000";
    }
    var socket = io(baseUrl);
    function returnSocket(){return socket;}
    deviceReady.returnSocket=returnSocket;
    getGPS();
    backBtn();
    getServerIp("public");
    createFolders();
    startCheckingNetworkConnection();
}
function processStatus(time,text){
    SpinnerPlugin.activityStart(text, { dimBackground: true });
    processing=true;
    setTimeout(function(){
         if(processing==true){
            SpinnerPlugin.activityStop();
            showToast('There was an error, Or check your internet connection');
            processing=false;
         }
    },time);
}
function stopProcess(){
    processing=false;
    SpinnerPlugin.activityStop();
}
function serverConfig(){
    if(checkConnection()=='WiFi connection'){
        getServerIp('local');
    }else if(checkConnection()=='No network connection'){
       getServerIp('public');
       showToast("You are not connected to the internet!");
    }else{
        getServerIp('public');
    }
}
function getServerIp(serverStatus){
    var socket = deviceReady.returnSocket();
    socket.emit("getServerIp",function(result){
        serverArray = result;
    });
}
function onlineOfflineStatus(){
    document.addEventListener("online", function() {
        alert("You are online now");
    }, false);

    document.addEventListener("offline", function() {
        StatusBar.backgroundColorByHexString('#ffffff');
    }, false);
}
function startCheckingNetworkConnection() {
    if(isLoggedIn())
    setInterval(function() {
        chooseServer(window.localStorage.getItem("branch_code"),function(ip,port){
            var newBaseUrl = "http://"+ip+":"+port;
            if(newBaseUrl != window.localStorage.getItem("baseUrl")){
                window.localStorage.setItem("baseUrl",newBaseUrl);
                showToast("network change detected");
                deviceReady();
            }
        })
    }, 15000);
 }
function checkConnection() {
    var networkState = navigator.connection.type;
    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';
    return states[networkState];
}
function phoneNoValidation(phone){
    phoneNumber = phone.replace(/ /g, '');
    if ((phoneNumber.length < 12) && (phoneNumber.length > 7)) {
        if (phoneNumber[0]!='0') {
            phoneNumber = phoneNumber;
        }else{
            phoneNumber = phoneNumber.slice(1,phoneNumber.length)
        }
        var x = '+' + $(".countryList").val();
        phoneNumber = x+phoneNumber;
        return phoneNumber;
    }else{
        return "Incorrect phone number";
    }
}
function showToast(message) {
  window.plugins.toast.showWithOptions(
    {
      message: message,
      duration: "long", // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
      position: "bottom",
      addPixelsY: -100  // added a negative value to move it up a bit (default 0)
    }
  );
}
function getRecent(){
  //var keyRef=['MS006728','ML23566','MS1009500','ML456236'];
  var socket = deviceReady.returnSocket();
  socket.emit("getRecent",function(result){
    displayKeyRef(result);
  });
}
function loadPage(pageName){
  mainView.router.load({pageName: pageName});
}
function displayKeyRef(result){
    recentArray=result;
    if(result.length>0){
        for (var i = 0; i < result.length; i++) {
            $$(".scrolling-wrapper").append("<div class='card recent-card-key-ref' Key_Ref='"+result[i].Key_Ref+"' index="+i+" style='padding:0px;width: 120px;border-radius:5px;box-shadow:none;border: 1px solid #e9eaed;display: inline-block;'><div class='card-header' style='text-transform: uppercase;color: #757575;font-size: 10px;font-weight: bold;min-height:40px;white-space: nowrap; overflow: hidden;text-overflow: ellipsis;padding-right:3px;background:#e9eaed;'>"+result[i].Reg_No+"</div><div class='card-content'><div class='card-content-inner'><center><i class='material-icons' style='font-size:50px;color:#87ceeb;'>directions_car</i></center></div></div><div class='card-footer' style='font-weight:bold; font-size:10px;min-height:30px;background:#e9eaed;'>"+result[i].Key_Ref.toUpperCase()+"</div></div>");
        }
    }else{
        showToast("No result found!");
    }
}
function phoneNoValidation(phone){
    phoneNumber = phone.replace(/ /g, '');
    if ((phoneNumber.length < 16) && (phoneNumber.length > 7)) {
        if(phoneNumber[0]=="0" && phoneNumber[1]=="0"){
            var countryCode = '00'+ $$(".select-country-cus-code-input").val();
            phoneNumber = phoneNumber.slice(countryCode.length,phoneNumber.length)
        }else if(phoneNumber[0]=="+"){
            var countryCode = '+'+ $$(".select-country-cus-code-input").val();
            phoneNumber = phoneNumber.slice(countryCode.length,phoneNumber.length)
        }else if(phoneNumber[0]=="0" && phoneNumber[1]!="0"){
            phoneNumber = phoneNumber.slice(1,phoneNumber.length)
        }else if(phoneNumber[0]!="0"){
            phoneNumber = phoneNumber;
        }else{
            phoneNumber = phoneNumber
        }
        return phoneNumber;
    }else{
        return "Incorrect phone number";
    }
}
function goToOptionPage(Key_Ref){
    activeKeyRef = Key_Ref;
    $$(".card-show-key-ref").text(Key_Ref);
    if(lastKey!=activeKeyRef){
        window.localStorage.setItem("lastKey",activeKeyRef);
        window.localStorage.removeItem("lastItem");
    }
    //loadPage('option-page');
}
function createFolders(){
    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function(fileSystem) {
        fileSystem.getDirectory("mag-snapshot", {create: true, exclusive: false},function(dirEntry) {
            fileSystem.getDirectory("mag-snapshot/files", {create: true, exclusive: false},function(secEntry) {},null);
        }, function (error) {
           showToast("Could not resolve directory");
        });
    }, function (error) {
       createFolders();
    });
}
function downloadFile(url,fileURI,callback){
    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function(fileSystem) {
        fileSystem.getFile(fileURI, {create: true, exclusive: false}, function(fileEntry){
           var nativeUrl = fileEntry.nativeURL;
           var fileTransfer = new FileTransfer();
           var uri = encodeURI(url);
           fileTransfer.download(uri, nativeUrl, function(entry) {
                 callback(entry.toURL());
              },function(error) {
                 if(error.source){
                    showToast(error.source);
                 }else if(error.target){
                    showToast(error.target)
                 }else if(error.code){
                    showToast(error.code)
                 }
              },
              false, {
                 headers: {
                    "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
                 }
              }
           );
        }, function(error){
            showToast("Error creating directory "+error.code);
        });
    }, null);
}
function openCamera(cb){
    if(deviceName.toUpperCase()!="HUAWEI" || deviceName==null){
        navigator.camera.getPicture(onSuccess, function(error){
            if((error.indexOf("No Image Selected") == -1) || (error!='No Image Selected')){
                alternativeCamera(function(fileUri){
                    cb(fileUri)
                })
            }else{
                showToast(error)
            }
        },{
          quality: 50,
          correctOrientation: true,
          destinationType: Camera.DestinationType.FILE_URL
        });
        function onSuccess(fileUri) {
            cb(fileUri);
            var filename = fileUri.substr(fileUri.lastIndexOf('/') + 1);
            filename = "mag-snapshot/files/"+filename;
            downloadFile(fileUri,filename,function(nativeURL){})
        }
    }else{
        alternativeCamera(function(fileUri){
            cb(fileUri)
        })
    }
}
function alternativeCamera(cb){
    var captureSuccess = function(mediaFiles) {
        var i, path, len;
        for (i = 0, len = mediaFiles.length; i < len; i += 1) {
            path = mediaFiles[i].fullPath;
            cb(path)
            var filename = path.substr(path.lastIndexOf('/') + 1);
            filename = "mag-snapshot/files/"+filename;
            downloadFile(path,filename,function(nativeURL){})
        }
    };
    var captureError = function(error) {
        navigator.notification.alert('Error code: ' + error.code+' '+error, null, 'Capture Error');
    };
    navigator.device.capture.captureImage(captureSuccess, captureError, {limit:1,quality:0});
}
function openGallery(cb){
   navigator.camera.getPicture(onSuccess, function(error){
    showToast(error);
   }, { quality: 50,
      destinationType: Camera.DestinationType.FILE_URL,
      sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
      mediaType:Camera.MediaType.ALLMEDIA,
      allowEdit: true,
        targetWidth:800,
        targetHeight:800
   });
   function onSuccess(fileUri) {
     fileUri = 'file://' + fileUri;
     cb(fileUri);
   }
}
function uploadFile(fileURI,filePath,mimeType,callback){
    var options = new FileUploadOptions();
    options.fileKey = "fileUrl";
    options.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
    options.mimeType = mimeType;
    var params = new Object();
    params.filePath = filePath;
    options.params = params;
    options.chunkedMode = false;
    var ft = new FileTransfer();
    ft.upload(fileURI,baseUrl+"/upload", function(response){
        callback('success');
    }, function(error){
        callback('error');
    },options);
}
function saveOtherPhoto(category,photo_type,photoSource){
    var socket = deviceReady.returnSocket();
    var photoLocation = "../mag_qoutation/photos/"+activeKeyRef+"/"+activeKeyRef + photo_type + Math.floor(Math.random()*899999+100000) +".png";
    //var photoLocation = "../ais_new/public/images/mag_photos/"+activeKeyRef+"/"+activeKeyRef + photo_type +".png";
    if(photoSource=="CAMERA"){
        openCamera(function(fileUrl){
            nowUploadFiles(fileUrl);
        })
    }else{
        openGallery(function(fileUrl){
            nowUploadFiles(fileUrl);
        })
    }
    function nowUploadFiles(fileUrl){
        uploadFile(fileUrl,photoLocation,"image/png",function(response){
            if(response=='success'){
                socket.emit("saveOtherPhoto",activeKeyRef,photo_type,photoLocation,category,function(result){
                    stopProcess();
                    if(result){
                        showToast(photo_type+" has been uploaded!");
                    }
                });
            }
        });
        processStatus(60000,"Please wait while uploading "+photo_type);
    }
}
function getGPS(){
    if(userId){
        webGPS(function(latitude,longitude){
            function onSuccess(position) {
                trackDevice(position.coords.latitude,position.coords.longitude);
            }
            function onError(error) {
                showToast("Position still maintained");
            }
            GPSLocation.getCurrentPosition(onSuccess, onError);
            setTimeout(function(){ getGPS() },10000)
        });
    }
}
function webGPS(cb){
    navigator.geolocation.getCurrentPosition(function(position){
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        cb(latitude,longitude);
    }, function(err){
        cb(0,0);
    }, {enableHighAccuracy: false, timeout: 10*1000, maximumAge: 1000*60*10});
}
function trackDevice(latitude,longitude){
    var socket = deviceReady.returnSocket();
    socket.emit("trackDriver",latitude,longitude,userId);
}
function isLoggedIn(){
    if(loginStatus){
        $$(".go-to-login-page-btn").html("<i class='material-icons color-red' style='font-size:36px;'>lock</i>");
        return true;
    }else{
        showToast("Please login to proceed!");
        return false;
    }
}
function searchKeyFn(keyRef){
    var socket = deviceReady.returnSocket();
    socket.emit("search-keyRef",keyRef,function(result){
        stopProcess();
        if(result.length>0){
            searchKeyArray = result;
            goToOptionPage(result[0].Key_Ref);
            $(".search-input-div").slideUp(1000);
            $(".vehicle-info-div").fadeIn(3000);
            isSearchDivVisible = false;
        }else{
            showToast("No result found");
        }
    });
    processStatus(10000,"Retrieving data, please wait...");
}
var clicked = 0;
function backBtn(){
    document.addEventListener("backbutton", function(e){
       backBtnFn();
    }, false);
}
function backBtnFn(){
    if(mainView.activePage.name=='option-page'){
        clicked++;
        if(clicked==2){
            navigator.app.exitApp();
        }
        setTimeout(function(){
            clicked=0;
            showToast('Double click to exit the app')
        },500);
    }else{
        navigator.app.backHistory();
    }
}