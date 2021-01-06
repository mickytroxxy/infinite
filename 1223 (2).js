var tempVariable = null;
var myApp = new Framework7({
    modalTitle: '',
    material: true,
    pushState: true,
});
var $$ = Dom7;
var mainView = myApp.addView('.view-main', {
    dynamicNavbar: true,
    domCache: true
});
document.addEventListener("deviceready", deviceReady, false);
$$(document).on("click",".search-btn",  function(e) {
    if(isLoggedIn()){
        var keyRef = $$(".key-ref-input").val();
        if (keyRef!="") {
            searchKeyFn(keyRef)
        }else{
            showToast("Enter Key Ref to proceed!");
        }
    }
});
$$(document).on("click",".show-search-input-btn",  function(e) {
    $(".vehicle-info-div").slideUp(1000);
    $(".search-input-div").fadeIn(3000);
    isSearchDivVisible = true;
});
$$(document).on("keypress",".key-ref-input",  function(e) {
    if(isLoggedIn())
    var keyRef = $$(this).val();
    if(e.which == 13) {
        if (keyRef!="") {
            searchKeyFn(keyRef);
        }else{
            showToast("Enter Key Ref to proceed!");
        }
    }
});
$$(document).on("click",".add-new-client-btn",  function(e) {
    if(isLoggedIn())
    loadPage('add-new-client-page');
});
$$(document).on("click",".add-new-stock-btn",  function(e) {
    if(isLoggedIn())
    loadPage('add-store-page');
});
$$(document).on("click",".add-new-paint-btn",  function(e) {
    if(isLoggedIn())
    loadPage('add-paint-page');
});
$$(document).on("change",".option-goBack", function(e){
    navigator.app.backHistory();
});
$$(document).on("click",".recent-card-key-ref",  function(e) {
    if(isLoggedIn())
    goToOptionPage($$(this).attr("Key_Ref"));
});
$$(document).on("click",".go-to-login-page-btn",  function(e) {
    if(!isLoggedIn())
        loadPage("login-page");
    else
        navigator.notification.confirm('You will be logged out, Press confirm to logout',function(buttonIndex){
            if(buttonIndex==1){
                loginStatus = false;
                userId = null;
                $$(".go-to-login-page-btn").html("<i class='material-icons color-green' style='font-size:36px;'>lock</i>");
                window.localStorage.removeItem("userId");
                window.localStorage.removeItem("loginStatus");
                window.localStorage.removeItem("baseUrl");
                window.localStorage.removeItem("branch_code");
            }
        },'CONFIRM LOGOUT',['Confirm','Cancel']);
});
$$(document).on("click",".login-btn",  function(e) {
    var branch = $$(".login-branch-input").val().trim().toUpperCase();
    var password = $$(".login-password-input").val();
    if(password!="" && branch!=""){
        chooseServer(branch,function(ip,port){
            var newBaseUrl = "http://"+ip+":"+port;
            var socket = io(newBaseUrl);
            socket.emit("login",branch,password,function(result){
                stopProcess();
                if(result!=false){
                    userId = result
                    loginStatus = true;
                    window.localStorage.setItem("userId",userId);
                    window.localStorage.setItem("loginStatus",true);
                    $$(".login-password-input").val("");
                    $$(".go-to-login-page-btn").html("<i class='material-icons color-red' style='font-size:36px;'>lock</i>");
                    showToast("Access granted!");
                    window.localStorage.setItem("baseUrl",newBaseUrl);
                    window.localStorage.setItem("branch_code",branch);
                    window.location = "index.html";
                }else{
                    showToast("Invalid login credentials!");
                }
            });
            processStatus(10000,'Please wait while checking your credentials!');
        });
    }else{
        showToast("Please enter valid password!");
    }
});
function chooseServer(branch_code,cb){
    if(serverArray.length>0){
        for (var i = 0; i < serverArray.length; i++){
            var company_code=serverArray[i].company_code;
            var local_ip=serverArray[i].local_ip;
            var remote_ip=serverArray[i].remote_ip;
            var port=serverArray[i].port;
            if (branch_code==company_code) {
                if(checkConnection()=='WiFi connection'){
                    cb(local_ip,port);
                }else if(checkConnection()=='No network connection'){
                   cb(remote_ip,port);
                   showToast("You are not connected to the internet!");
                }else{
                    cb(remote_ip,port);
                }
            }
        }
    }
}
$$(document).on("click",".register-client-btn",  function(e) {
    var socket = deviceReady.returnSocket();
    var fname = $$(".fname-input").val();
    var lname = $$(".lname-input").val();
    var cellNo = $$(".cell-input").val();
    var regNo = $$(".reg-no-input").val();
    var vehicleMake = $$(".make_input").val();
    var branch = $$(".select-branch-input").val();
    if(fname.length>2){
        if(lname.length>2){
            if(regNo!="" || vehicleMake!=""){
                if(phoneNoValidation(cellNo)!="Incorrect phone number"){
                    navigator.notification.confirm('Have you provided legit info? Press confirm button to proceed!',function(buttonIndex){
                        if(buttonIndex==1){
                            socket.emit("saveClient",fname,lname,cellNo,regNo,vehicleMake,branch,function(result){
                                if(result!=false){
                                    goToOptionPage(result);
                                    $$(".fname-input,.lname-input,.cell-input,.reg-no-input,.make_input").val("");
                                    showToast("New client has been added successfully!");
                                }else{
                                    showToast("Could not save "+fname+", Please try again later!");
                                }
                            });
                        }
                    },'CONFIRM CLIENT',['Confirm','Cancel']);
                }else{
                    showToast(phoneNoValidation(cellNo));
                }
            }else{
                showToast("All fields are mandatory!");
            }
        }else{
            showToast("Please enter a valid last name!");
        }
    }else{
        showToast("Please enter a valid first name!");
    }
});
var bookingsArray = ['Licence Disk','Front Bumper','Bonnet','Right Front Fender','Right Front Door Mirror','Right Front Door','Right Rear Door','Right Rear Fender',
'Boot','Right Rear Tyre','Left Rear Tyre','Left Rear Fender','Left Rear Door','Left Front Door','Left Front Door Mirror','Left Front Fender','Left Front Headlamp',
'Right Front Headlamp','Front WindScreen','Roof','Engine','Left Front Tyre','Right Front Tyre','Spare wheel','Inside Boot','Left Front Door Inner Panel',
'Right Front Door Inner Panel','Left Rear Door Inner Panel','Right Rear Door Inner Panel','Right Front Carpet','Left Front Carpet','Right Rear Carpet',
'Left Rear Carpet','Left Front Seat','Right Front Seat','Rear Seats','Instrument Cover','Instrument Cluster','Console','Headlining','Radio','Keys'];
$$(document).on("click",".bookings-btn",  function(e) {
    var startPoint = window.localStorage.getItem("lastItem");
    if(isLoggedIn())
    if(!isSearchDivVisible){
        $$(".show-sub-header").text("BOOKINGS");
        $$(".display-bookings-btn").show();
        loadPage("capture-bookings-page");
        $$(".display-other-btn").hide();
        $$(".display-bookings-btn").html("");
        if(startPoint!=null){
            var lastIndex = bookingsArray.indexOf(startPoint)
            for (var i = lastIndex; i < bookingsArray.length; i++) {
                $$(".display-bookings-btn").append("<a href='#' class='button button-fill capture-bookings-btn' style='border-radius: 5px;display:none;background: url(images/wallpaper.jpg);background-size: cover;color:#757575;font-weight:bold;' title='"+bookingsArray[i]+"' id='"+i+"'>CAPTURE</a>");
            }
            $$("[title='"+bookingsArray[lastIndex]+"']").show();
            $$(".show-current-bookings-photo-div").text(bookingsArray[lastIndex]);
        }else{
            for (var i = 0; i < bookingsArray.length; i++) {
                $$(".display-bookings-btn").append("<a href='#' class='button button-fill capture-bookings-btn' style='border-radius: 5px;display:none;background: url(images/wallpaper.jpg);background-size: cover;color:#757575;font-weight:bold;' title='"+bookingsArray[i]+"' id='"+i+"'>CAPTURE</a>");
            }
            $$("[title='"+bookingsArray[0]+"']").show();
            $$(".show-current-bookings-photo-div").text(bookingsArray[0]);
        }
    }else{
        showToast("Please enter Key Ref to proceed!");
    }
});
$$(document).on("click",".capture-bookings-btn",  function(e) {
    var nextIndex = parseFloat(this.id) + 1;
    var elem = $$(this);
    var socket = deviceReady.returnSocket();
    openCamera(function(fileUrl){
        var photoLocation = "../mag_qoutation/mag_snapshot/security_images/"+activeKeyRef+"/"+bookingsArray[elem.attr("id")] + Math.floor(Math.random()*899999+100000)+".png";
        //var photoLocation = "../ais_new/public/images/mag_security/"+activeKeyRef+"/"+bookingsArray[elem.attr("id")]+".png";
        uploadFile(fileUrl,photoLocation,"image/png",function(response){
            if(response=='success'){
                socket.emit("saveBookingPhoto",activeKeyRef,bookingsArray[elem.attr("id")],photoLocation,function(result){
                    stopProcess();
                    if(bookingsArray[elem.attr("id")]!="Keys"){
                        elem.hide();
                        $$("[title='"+bookingsArray[nextIndex]+"']").show();
                        window.localStorage.setItem("lastItem",bookingsArray[elem.attr("id")]);
                        $$(".show-current-bookings-photo-div").text(bookingsArray[nextIndex]);
                    }else{
                        getChecklist();
                    }
                    if(result){
                        showToast(bookingsArray[elem.attr("id")]+" has been uploaded!");
                    }
                });
            }
        });
        processStatus(60000,"Please wait while uploading "+bookingsArray[elem.attr("id")]);
    })
});
$$(document).on("click",".add-other-photo-btn",  function(e) {
    if(isLoggedIn())
    if(!isSearchDivVisible){
        var photo_type = $(this).attr("title")
        $$(".show-sub-header").text(photo_type);
        $$(".display-other-btn").show();
        loadPage("capture-bookings-page");
        $$(".display-bookings-btn").hide();
        $$(".show-current-bookings-photo-div").text(photo_type);
        $$(".captureBtn").attr("title",photo_type);
    }else{
        showToast("Enter Key Ref to proceed!");
    }
});
$$(document).on("click",".work-in-progress-btn",  function(e) {
    if(isLoggedIn())
    if(!isSearchDivVisible){
        loadPage("work-in-progress-page");
    }else{
        showToast("Enter Key Ref to proceed!");
    }
});
$$(document).on("click",".captureBtn",  function(e) {
    var photo_type = $(this).attr("title");
    var photoSource = $(this).attr("name");
    saveOtherPhoto(photo_type,photo_type,photoSource);
});
$$(document).on("click",".get-client-details-btn",  function(e) {
    var socket = deviceReady.returnSocket();
    loadPage("security-checklist-page");
    socket.emit("getClientDetails",activeKeyRef,function(result){
        stopProcess();
        if(result.length>0){
            $$(".check-reg-input").val(result[0].Reg_No);
            $$(".check-make-input").val(result[0].Make);
            $$(".check-model-input").val(result[0].Model);
            $$(".check-chasis-input").val(result[0].Chasses_No);
            $$(".check-towed-input").val(result[0].towed_by);
            $$(".check-km-input").val(result[0].KM);
        }else{
            showToast("We couldn't find any info related to this key ref!");
        }
    });
    processStatus(10000,"Retrieving data, Please wait...");
});
$$(document).on("click",".update-security-btn",  function(e) {
    var socket = deviceReady.returnSocket();
    var Reg_No = $$(".check-reg-input").val();
    var Make = $$(".check-make-input").val();
    var Model = $$(".check-model-input").val();
    var Chasses_No = $$(".check-chasis-input").val();
    var towed_by = $$(".check-towed-input").val();
    var KM = $$(".check-km-input").val();
    if(Reg_No!="" && Make!="" && Chasses_No!=""){
        navigator.notification.confirm('You are about to update '+activeKeyRef+'. Your user key will be used to update this client info!',function(buttonIndex){
            if(buttonIndex==1){
                socket.emit("updateClient",Reg_No,Make,Model,Chasses_No,towed_by,activeKeyRef,userId,KM,function(cb){
                    stopProcess();
                    if(cb){
                        showToast("Updated successfully!");
                    }else{
                        showToast("Could not update!");
                    }
                })
                processStatus(10000,"Updating info, please wait...");
            }
        },'CONFIRM UPDATE',['Confirm','Cancel']);
    }else{
        showToast("Please fill in correctly to proceed!");
    }
});
$$(document).on("click",".work-in-progress-photo-btn",  function(e) {
    if(!isSearchDivVisible){
        var photo_type = $(this).attr("title");
        var photoSource = $(this).attr("name");
        saveOtherPhoto("WORK IN PROGRESS",photo_type,photoSource);
    }else{
        showToast("Enter Key Ref to proceed!");
    }
});
$$(document).on("click",".browse-stock-photo",  function(e) {
    openCamera(function(fileUrl){
        tempVariable = fileUrl;
    });
});
$$(document).on("click",".add-notes-btn",  function(e) {
    if(!isSearchDivVisible){
        loadPage("add-notes-page")
    }else{
        showToast("Enter Key Ref to proceed!");
    }
});
$$(document).on("click",".save-notes-btn",  function(e) {
    var notes = $$(".notes-input").val();
    var socket = deviceReady.returnSocket();
    if(notes.length>0){
        socket.emit('saveNotes',notes,activeKeyRef,userId,function(cb){
            stopProcess();
            if(cb){
                showToast("Notes saved!")
            }else{
                showToast('There was an error while trying to save notes!')
            }
        })
        processStatus(10000,"Saving notes, Please wait...")
    }else{
        showToast("Please add something to proceed!");
    }
});
$$(document).on("click",".add-stock-btn",  function(e) {
    var stockDesc = $$(".stock-desc-input").val();
    var stockAmount  = $$(".stock-amount-input").val();
    var stockNa = $$(".stock-na-input").val();
    var stockSupplier = $$(".stock-supplier-input").val();
    var stockCategory = $$(".stock-category-input").val();
    var stockBranch = $$(".stock-branch-input").val();
    //var photoLocation = "files/images/stock"+ Math.floor(Math.random()*899999+100000) +".png";
    //var photoLocation = "../mag_qoutation/photos/security_images/"+activeKeyRef+"/stock"+Math.floor(Math.random()*899999+100000) +".png";
    var photoLocation = "../Ordering_system/stock_icon/stock"+Math.floor(Math.random()*899999+100000) +".png";
    //var photoLocation = "../ais_new/public/images/mag_photos/"+activeKeyRef+"/stock"+ Math.floor(Math.random()*899999+100000) +".png";
    var socket = deviceReady.returnSocket();
    if(stockDesc.length>2 || stockAmount!="" || stockSupplier!=""){
        navigator.notification.confirm('By pressing the confirm button you agree that all information provided is correct!',function(buttonIndex){
            if(buttonIndex==1){
                if(tempVariable==null){
                    socket.emit("saveStock",stockDesc,stockAmount,stockNa,stockSupplier,stockCategory,stockBranch,'',function(cb){
                        stopProcess();
                        if(cb){
                            showToast("You have successfully added new stock");
                            $$(".stock-desc-input,.stock-na-input,.stock-amount-input,.stock-supplier-input").val("");
                        }else{
                            showToast("There was an error while trying to add new stock!");
                        }
                    });
                    processStatus(60000,"Please wait while saving data...");
                }else{
                    uploadFile(tempVariable,photoLocation,"image/png",function(response){
                        if(response=='success'){
                            socket.emit("saveStock",stockDesc,stockAmount,stockNa,stockSupplier,stockCategory,stockBranch,photoLocation,function(cb){
                                stopProcess();
                                if(cb){
                                    showToast("You have successfully added new stock");
                                    tempVariable=null;
                                    $$(".stock-desc-input,.stock-na-input,.stock-amount-input,.stock-supplier-input").val("");
                                }else{
                                    showToast("There was an error while trying to add new stock!");
                                }
                            });
                        }
                    });
                    processStatus(60000,"Please wait while saving data...");
                }
            }
        },'CONFIRM STOCK',['Confirm','Cancel']);
    }else{
        showToast("Please fill in correctly to proceed!");
    }
});
$$(document).on("click",".add-paint-btn",  function(e) {
    var paintDesc = $$(".paint-desc-input").val();
    var paintAmount  = $$(".paint-amount-input").val();
    var paintQuantity = $$(".paint-quantity-input").val();
    var paintSupplier = $$(".paint-supplier-input").val();
    var paintSize = $$(".paint-size-input").val();
    var paintBranch = $$(".paint-branch-input").val();
    var photoLocation = "../Ordering_system/stock_icon/paint"+Math.floor(Math.random()*899999+100000) +".png";
    //var photoLocation = "../ais_new/public/images/mag_security/"+activeKeyRef+"/paint"+ Math.floor(Math.random()*899999+100000) +".png";
    var socket = deviceReady.returnSocket();
    if(paintDesc.length>2 || paintAmount!="" || paintSupplier!=""){
        navigator.notification.confirm('By pressing the confirm button you agree that all information provided is correct!',function(buttonIndex){
            if(buttonIndex==1){
                if(tempVariable==null){
                    socket.emit("savePaint",paintDesc,paintAmount,paintQuantity,paintSupplier,paintSize,paintBranch,'',function(cb){
                        stopProcess();
                        if(cb){
                            showToast("You have successfully added new paint");
                            $$(".paint-desc-input,.paint-quantity-input,.paint-amount-input,.paint-supplier-input").val("");
                        }else{
                            showToast("There was an error while trying to add new paint!");
                        }
                    });
                    processStatus(60000,"Please wait while saving data...");
                }else{
                    uploadFile(tempVariable,photoLocation,"image/png",function(response){
                        if(response=='success'){
                            socket.emit("savePaint",paintDesc,paintAmount,paintQuantity,paintSupplier,paintSize,paintBranch,photoLocation,function(cb){
                                stopProcess();
                                if(cb){
                                    showToast("You have successfully added new paint");
                                    $$(".paint-desc-input,.paint-quantity-input,.paint-amount-input,.paint-supplier-input").val("");
                                    tempVariable=null;
                                }else{
                                    showToast("There was an error while trying to add new paint!");
                                }
                            });
                        }
                    });
                    processStatus(60000,"Please wait while saving data...");
                }
            }
        },'CONFIRM PAINT',['Confirm','Cancel']);
    }else{
        showToast("Please fill in correctly to proceed!");
    }
});
$$(document).on("click",".update-checklist-btn", function(e){
    var socket = deviceReady.returnSocket();
    var tyre_rf_make_input = $$(".tyre_rf_make_input").val();
    var tyre_rf_status_input = $$(".tyre_rf_status_input").val();
    var tyre_lf_make_input = $$(".tyre_lf_make_input").val();
    var tyre_lf_status_input = $$(".tyre_lf_status_input").val();
    var tyre_lr_make_input = $$(".tyre_lr_make_input").val();
    var tyre_lr_status_input = $$(".tyre_lr_status_input").val();
    var tyre_rr_make_input = $$(".tyre_rr_make_input").val();
    var tyre_rr_status_input = $$(".tyre_rr_status_input").val();

    var sparewheel_type_input = $$(".sparewheel_type_input").val();
    var sparewheel_status_input = $$(".sparewheel_status_input").val();
    var sparewheel_make_input = $$(".sparewheel_make_input").val();

    var mag_rf_type_input = $$(".mag_rf_type_input").val();
    var mag_rf_status_input = $$(".mag_rf_status_input").val();
    var mag_lf_type_input = $$(".mag_lf_type_input").val();
    var mag_lf_status_input = $$(".mag_lf_status_input").val();
    var mag_rr_type_input = $$(".mag_rr_type_input").val();
    var mag_rr_status_input = $$(".mag_rr_status_input").val();
    var mag_lr_type_input = $$(".mag_lr_type_input").val();
    var mag_lr_status_input = $$(".mag_lr_status_input").val();

    var light_rf_status_input = $$(".light_rf_status_input").val();
    var light_rf_none_input = $$(".light_rf_none_input").attr('status');
    var light_lf_status_input = $$(".light_lf_status_input").val();
    var light_lf_none_input = $$(".light_lf_none_input").attr('status');
    var light_rr_status_input = $$(".light_rr_status_input").val();
    var light_rr_none_input = $$(".light_rr_none_input").attr('status');
    var light_lr_status_input = $$(".light_lr_status_input").val();
    var light_lr_none_input = $$(".light_lr_none_input").attr('status');

    var indicator_rf_status_input = $$(".indicator_rf_status_input").val();
    var indicator_rf_none_input = $$(".indicator_rf_none_input").attr('status');
    var indicator_lf_status_input = $$(".indicator_lf_status_input").val();
    var indicator_lf_none_input = $$(".indicator_lf_none_input").attr('status');
    var indicator_rr_status_input = $$(".indicator_rr_status_input").val();
    var indicator_rr_none_input = $$(".indicator_rr_none_input").attr('status');
    var indicator_lr_status_input = $$(".indicator_lr_status_input").val();
    var indicator_lr_none_input = $$(".indicator_lr_none_input").attr('status');

    var mirror_rf_status_input = $$(".mirror_rf_status_input").val();
    var mirror_rf_none_input = $$(".mirror_rf_none_input").attr('status');
    var mirror_lf_status_input = $$(".mirror_lf_status_input").val();
    var mirror_lf_none_input = $$(".mirror_lf_none_input").attr('status');

    var upholstry_rf_status_input = $$(".upholstry_rf_status_input").val();
    var upholstry_rf_stained_input = $$(".upholstry_rf_stained_input").val();
    var upholstry_lf_status_input = $$(".upholstry_lf_status_input").val();
    var upholstry_lf_stained_input = $$(".upholstry_lf_stained_input").val();
    var upholstry_rr_status_input = $$(".upholstry_rr_status_input").val();
    var upholstry_rr_stained_input = $$(".upholstry_rr_stained_input").val();
    var upholstry_lr_status_input = $$(".upholstry_lr_status_input").val();
    var upholstry_lr_stained_input = $$(".upholstry_lr_stained_input").val();

    var radio_status_input = $$(".radio_status_input").val();
    var radio_face_status_input = $$(".radio_face_status_input").val();
    var cd_shuttle_status_input = $$(".cd_shuttle_status_input").val();
    var cd_player_status_input = $$(".cd_player_status_input").val();
    var aerial_status_input = $$(".aerial_status_input").val();
    var battery_status_input = $$(".battery_status_input").val();
    var keys_status_input = $$(".keys_status_input").val();
    var service_book_status_input = $$(".service_book_status_input").val();
    var back_board_status_input = $$(".back_board_status_input").val();
    var spanner_status_input = $$(".spanner_status_input").val();
    var tools_status_input = $$(".tools_status_input").val();
    var jack_status_input = $$(".jack_status_input").val();
    var triangle_status_input = $$(".triangle_status_input").val();
    var lock_nut_status_input = $$(".lock_nut_status_input").val();
    var gear_lock_status_input = $$(".gear_lock_status_input").val();
    var cig_lighter_status_input = $$(".cig_lighter_status_input").val();
    var car_mats_status_input = $$(".car_mats_status_input").val();
    var centre_caps_status_input = $$(".centre_caps_status_input").val();
    navigator.notification.confirm('This key ref security checklist data will be updated. Press confirm to proceed!',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit("update-checklist-event",activeKeyRef,tyre_rf_make_input,tyre_rf_status_input,tyre_lf_make_input,tyre_lf_status_input,tyre_lr_make_input,tyre_lr_status_input,tyre_rr_make_input,tyre_rr_status_input,sparewheel_make_input,sparewheel_type_input,sparewheel_status_input,mag_rf_type_input,mag_rf_status_input,mag_lf_type_input,mag_lf_status_input,mag_rr_type_input,mag_rr_status_input,mag_lr_type_input,mag_lr_status_input,light_rf_status_input,light_rf_none_input,light_lf_status_input,light_lf_none_input,light_rr_status_input,light_rr_none_input,light_lr_status_input,light_lr_none_input,indicator_rf_status_input,indicator_rf_none_input,indicator_lf_status_input,indicator_lf_none_input,indicator_rr_status_input,indicator_rr_none_input,indicator_lr_status_input,indicator_lr_none_input,mirror_rf_status_input,mirror_rf_none_input,mirror_lf_status_input,mirror_lf_none_input,upholstry_rf_status_input,upholstry_rf_stained_input,upholstry_lf_status_input,upholstry_lf_stained_input,upholstry_rr_status_input,upholstry_rr_stained_input,upholstry_lr_status_input,upholstry_lr_stained_input,radio_status_input,radio_face_status_input,cd_shuttle_status_input,cd_player_status_input,aerial_status_input,battery_status_input,keys_status_input,service_book_status_input,back_board_status_input,spanner_status_input,tools_status_input,jack_status_input,triangle_status_input,lock_nut_status_input,gear_lock_status_input,cig_lighter_status_input,car_mats_status_input,centre_caps_status_input,function(cb){
                stopProcess();
                if(cb){
                    showToast("security checklist updates success");
                    navigator.app.backHistory();
                }else{
                    showToast("Could not update!");
                }
            });
            processStatus(10000,'Updating security checklist...');
        }
    },'CONFIRM UPDATE',['Confirm','Cancel']);
});
$$(document).on("change",".advanced-checkbox",  function(e) {
    if($(this).attr("checked")){
        $(this).removeAttr("checked").attr('status','');;
    }else{
        $(this).attr('checked','checked').attr('status','NONE');
    }
});
function getChecklist(){
    loadPage("security-checklist-page");
    var socket = deviceReady.returnSocket();
    $$(".security-checklist-header").text("SECURITY CHECK("+activeKeyRef+")");
    socket.emit("get-more-checklist",activeKeyRef,function(result){
        if(result.length>0){
            $$(".tyre_rf_make_input").val(result[0].tyer_rf_make);
            $$(".tyre_lf_make_input").val(result[0].tyer_lf_make);
            $$(".tyre_lr_make_input").val(result[0].tyer_lr_make);
            $$(".sparewheel_type_input").val(result[0].tyer_rr_make);
            $$(".sparewheel_type_input").val(result[0].s_wheel_make);
        }
    })
}
$$(document).on("click",".security-checklist-btn",  function(e) {
    getChecklist();
});
$$(document).on("click",".scan-document-btn",  function(e) {
    if(isLoggedIn());
    var socket = deviceReady.returnSocket();
    if(!isSearchDivVisible){
        scanDocument((fileUrl)=>{
            var photoLocation = "../mag_qoutation/mag_snapshot/security_images/"+activeKeyRef+"/"+activeKeyRef + Math.floor(Math.random()*899999+100000)+".pdf";
            uploadFile(fileUrl,photoLocation,"application/pdf",function(response){
                stopProcess();
                if(response=="success"){
                    showToast("Document uploaded successfully!");
                    socket.emit("updateClientDoc",photoLocation,activeKeyRef,(cb)=>{

                    });
                }
            });
            processStatus(30000,"Uploading pdf file for Key ref "+activeKeyRef+"...");
        });
    }else{
        showToast("Enter Key Ref to proceed!");
    }
});
const scanDocument = (cb) =>{
    scan.scanDoc((imageData)=>{
        processStatus(10000,"Converting image to pdf...");
        pdf.htmlToPDF({
            data: "<html> <img src='"+imageData+"'> </html>",
            documentSize: 'A4',
            landscape: 'portrait',
            type: 'base64'
        }, (myBase64)=>{
            var contentType = "application/pdf";
            var folderpath = cordova.file.externalRootDirectory;
            var filename = "helloWorld.pdf";
            savebase64AsPDF(folderpath,filename,myBase64,contentType,(file)=>{
                stopProcess();
                cb(file.nativeURL)
            });
        }, ()=>{
            alert("Failed")
        });
    },(message)=>{
        alert('Failed because: ' + message);
    },{sourceType : 1, fileName : "myfilename", quality : 1.0, returnBase64 : false});
}
function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;
    var byteCharacters = atob(b64Data);
    var byteArrays = [];
    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);
        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
}
function savebase64AsPDF(folderpath,filename,content,contentType,cb){
    var DataBlob = b64toBlob(content,contentType);
    console.log("Starting to write the file :3");
    window.resolveLocalFileSystemURL(folderpath, function(dir) {
        console.log("Access to the directory granted succesfully");
		dir.getFile(filename, {create:true}, function(file) {
            console.log("File created succesfully.");
            file.createWriter(function(fileWriter) {
                console.log("Writing content to file");
                fileWriter.write(DataBlob);
                cb(file);
            }, function(){
                alert('Unable to save file in path '+ folderpath);
            });
		});
    });
}
$$(document).on("click",".scanVin-btn",  function(e) {
    window.plugins.GMVBarcodeScanner.scan({}, function(err, result) {
        if(err) return;
        var resultArray = result.split("%");
        $$(".reg-no-input").val(resultArray[7]);
        $$(".make_input").val(resultArray[8] +" "+resultArray[9]+" "+resultArray[10]);
    });
});









