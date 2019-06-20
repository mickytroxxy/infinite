var app     =     require("express")();
var mysql   =     require("mysql");
var http    =     require('http').Server(app);
var io      =     require("socket.io")(http);
var nodemailer = require('nodemailer');
var Twocheckout = require('2checkout-node');
var pool    =    mysql.createPool({
  connectionLimit   :   100,
  host              :   'xtrabraindb.cdeosiunsuwv.us-east-2.rds.amazonaws.com',
  port              :   3306,
  user              :   'mickytroxxy',
  password          :   '7624TROXXy!',
  database          :   'rushwallet',
  debug             :   false,
  multipleStatements : true
});
/*var pool    =    mysql.createPool({
  connectionLimit   :   100,
  host              :   '127.0.0.1',
  port              :   3306,
  user              :   'root',
  password          :   '',
  database          :   'pos',
  debug             :   false,
  multipleStatements : true
});*/
io.sockets.on('connection', function (socket) {
  console.log('a user has connected client');
  socket.on('add-item',function(itemName, itemDesc, itemBuying, itemSelling, itemBarcode, itemCategory, timeAdded, itemQuantity, shopId, itemWeight, cb){
    console.log(itemSelling)
    pool.getConnection(function(err,connection){  
      if (!err) {
        connection.query('SELECT * FROM items WHERE itemBarcode=? AND shopId=?',[itemBarcode,shopId],function(error,result){
          if (!error) {
            if (result.length==0) {
              connection.query('INSERT INTO items SET ?', {itemName:itemName, itemDesc:itemDesc, itemBuying:itemBuying, itemSelling:itemSelling, itemBarcode:itemBarcode, itemCategory:itemCategory, timeAdded:timeAdded, itemQuantity:itemQuantity, shopId:shopId, itemWeight:itemWeight}, function (err, results, fields) {
                if (!err) {
                  console.log("New item has been added");
                  connection.release();
                  cb(200,'success')
                }else{
                  cb(400,'There was an error while trying to add your item')
                }
              });
            }else{
              cb(201,'The barcode you have entered is already in your shop. Try to manage it instead');
            }
          }
        });
      }
    });
  })
  socket.on('getItemByBarcode', function(readBarcode,shopId,cb){
    console.log('wowowowowow')
    pool.getConnection(function(err,connection){  
      if (!err) {
        connection.query('SELECT * FROM items WHERE itemBarcode=? AND shopId=?',[readBarcode,shopId],function(error,result){
          if (!error) {
            if (result.length>0) {
              for (var i = 0; i < result.length; i++){
                var id=result[i].id;
                var itemName=result[i].itemName;
                var itemDesc=result[i].itemDesc;
                var itemSelling=result[i].itemSelling;
                var itemQuantity=result[i].itemQuantity;
                var itemBuying=result[i].itemBuying;
                var itemWeight=result[i].itemWeight;
                if (parseFloat(itemQuantity)>0) {
                  cb(200,itemName,itemDesc,itemSelling,id,itemBuying,itemWeight);
                }else{
                  cb('we do not have '+itemName+' anymore!',0,0,0)
                }
              }
            }else{
              cb('There is no such barcode in the system!',0,0,0)
            }
          }
          connection.release();
        });
      }
    });
  });
  socket.on('getShopDetails', function(shopId,cb){
    pool.getConnection(function(err,connection){  
      connection.query('SELECT * FROM shops WHERE shopId=?',[shopId],function(error,result){
        if (!error) {
          if (result.length>0) {
            for (var i = 0; i < result.length; i++){
              var shopName=result[i].shopName;
              var shopMerchant=result[i].shopMerchant;

              var merchantSellerId=result[i].merchantSellerId;
              var merchantPublishableKey=result[i].merchantPublishableKey;
              var merchantPrivateKey=result[i].merchantPrivateKey;

              cb(shopId,shopName,shopMerchant,merchantSellerId,merchantPublishableKey,merchantPrivateKey);
            }
          }else{
            cb(0,0)
          }
        }
        connection.release();
      });
    });
  });
  socket.on('make_payment', function(amount,token,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight,merchantSellerId,merchantPrivateKey){
    var tco = new Twocheckout({
        sellerId: merchantSellerId,         // Seller ID, required for all non Admin API bindings 
        privateKey: merchantPrivateKey,     // Payment API private key, required for checkout.authorize binding
        sandbox: true                          // Uses 2Checkout sandbox URL for all bindings
    });
    console.log(token+' '+amount)
    var params = {
        "merchantOrderId": "123",
        "token": token,
        "currency": "USD",
        "total": amount,
        "billingAddr": {
            "name": "Micky Ndhlovu",
            "addrLine1": "123 Test St",
            "city": "Johannesburg",
            "state": "Gauteng",
            "zipCode": "1811",
            "country": "RSA",
            "email": "mickytroxxy@gmail.com",
            "phoneNumber": "0735711170"
        }
    };

    tco.checkout.authorize(params, function (error, data) {
        if (error) {
            console.log(error.message);
          socket.emit('payment-error');
        } else {
            //response.send(data.response.responseMsg);
          savePaymentDetails(amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight,socket);
        }
    });
  });
  socket.on('make_cash_payment', function(amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight){
    savePaymentDetails(amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight,socket);
  });
  socket.on('get-payment-history', function(buyerNumber,userLogged,shopId){
    if (userLogged=='customer') {
      var sql = 'SELECT * FROM payments WHERE buyerNumber=?';
      var identifier=buyerNumber;
    }else{
      var sql = 'SELECT * FROM payments WHERE shopId=?';
      var identifier=shopId;
    }
    pool.getConnection(function(err,connection){  
      connection.query(sql,[identifier],function(error,result){
        if (!error) {
          if (result.length>0) {
            for (var i = 0; i < result.length; i++){
              (function(x){
                 setTimeout(function () {
                    var orderNumber=result[x].id;
                    var shopId=result[x].shopId;
                    var itemListString=result[x].itemListString;
                    var amount=result[x].amount;
                    var totalWeight=result[x].totalWeight;
                    getShopName(shopId,function(shopName){
                      socket.emit('get-payment-history', orderNumber,shopId,shopName,itemListString,amount,totalWeight);
                    })
                 }, 500 * i);
              })(i);
            }
          }
        }
      });
    });
  });
  socket.on('register-shop', function(shopId,shopName,shopAddress,shopEmail,shopCategory,password,adminName,adminId,shopMerchant,cb){
    pool.getConnection(function(err,connection){  
      connection.query('SELECT * FROM shops WHERE shopEmail=?',[shopEmail],function(error,result){
        if (!error) {
          if (result.length==0) {
            connection.query('INSERT INTO shops SET ?', {shopId:shopId, shopName:shopName, shopAddress:shopAddress, shopEmail:shopEmail, shopCategory:shopCategory, password:password, shopMerchant:shopMerchant}, function (err, results, fields) {
              connection.query('INSERT INTO shopusers SET ?', {fname:adminName, position:'ADMIN', userId:adminId, shopId:shopId}, function (err, results, fields) {
                if (!err) {
                  console.log("New shop has been added called "+shopName);
                  cb(200)
                }
              });
            });
          }else{
            cb(400)
          }
        }
        connection.release();
      });
    }); 
  });
  socket.on('login', function(shopId,password,cb){
    console.log('great '+shopId+" "+password);
    pool.getConnection(function(err,connection){  
      connection.query('SELECT * FROM shops WHERE shopId=? AND password=?',[shopId,password],function(error,result){
        if (!error) {
          if (result.length>0) {
            for (var i = 0; i < result.length; i++){
              var shopName=result[i].shopName;
              var shopMerchant=result[i].shopMerchant;
              var shopAddress=result[i].shopAddress;
              var merchantSellerId=result[i].merchantSellerId;
              var merchantPublishableKey=result[i].merchantPublishableKey;
              var merchantPrivateKey=result[i].merchantPrivateKey;
              cb(shopName,shopMerchant,shopAddress,merchantSellerId,merchantPublishableKey,merchantPrivateKey);
              console.log('therrrrrrrrrrrrrrrrrrrrrrrr');
            }
          }else{
            cb(400);
          }
        }
        connection.release();
      });
    }); 
  });
  socket.on('shop-view-reports', function(shopId){
    pool.getConnection(function(err,connection){  
      connection.query('SELECT * FROM payments WHERE shopId=?',[shopId],function(error,result){
        if (!error) {
          if (result.length>0) {
            for (var i = 0; i < result.length; i++){
              var orderNumber=result[i].id;
              var shopId=result[i].shopId;
              var itemListString=result[i].itemListString;
              var amount=result[i].amount;
              var initAmount=result[i].initAmount;
              socket.emit('shop-view-reports', orderNumber,shopId,itemListString,amount,initAmount);
            }
          }
        }
      });
    });
  });
  socket.on('get-wallet-id', function(walletId,cb){
    console.log('the wallet is '+walletId)
    pool.getConnection(function(err,connection){  
      connection.query('SELECT * FROM wallets WHERE walletId=?',[walletId],function(error,result){
        if (!error) {
          if (result.length>0) {
            cb(200)
          }else{
            cb(0)
          }
          connection.release();
        }
      });
    });
  });
  socket.on('register-wallet', function(walletId,fname,phoneNo,password,cb){
    pool.getConnection(function(err,connection){  
      connection.query('SELECT * FROM wallets WHERE phoneNo=?',[phoneNo],function(error,result){
        if (!error) {
          if (result.length==0) {
            connection.query('INSERT INTO wallets SET ?', {walletId:walletId, fname:fname, phoneNo:phoneNo, password:password, balance:'0'}, function (err, results, fields) {
              if (!err) {
                console.log("New walled has been added by "+fname);
                cb(200)
              }
            });
          }else{
            cb(400)
          }
        }
        connection.release();
      });
    }); 
  });
  socket.on('wallet-login', function(walletId,password,cb){
    pool.getConnection(function(err,connection){  
      connection.query('SELECT * FROM wallets WHERE walletId=? AND password=?',[walletId,password],function(error,result){
        if (!error) {
          if (result.length>0) {
            for (var i = 0; i < result.length; i++){
              var fname=result[i].fname;
              var balance=result[i].balance;
              cb(200,fname,balance)
            }
          }else{
            cb(0,0,0)
          }
          connection.release();
        }
      });
    });
  });
  socket.on('make_deposit', function(amount,newWalletBalance,nonce,walletId,transactionTime,approvalCode,cb){
    console.log(transactionTime)
    /*console.log(nonce+' '+amount)
    gateway.transaction.sale({
      amount: amount,
      paymentMethodNonce: nonce
    }, function (err, result) {
      if (err) throw err;
      if (result.success) {
        updateWallet(amount,newWalletBalance,walletId,transactionTime,cb);
      }else {
        cb(0)
      }
    });*/
    updateWallet(amount,newWalletBalance,walletId,transactionTime,approvalCode,walletId,cb);
  });
  socket.on('get-wallet-receiver', function(walletId,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('SELECT * FROM wallets WHERE walletId=?',[walletId],function(error,result){
          if (!error) {
            if (result.length>0) {
              for (var i = 0; i < result.length; i++){
                var fname=result[i].fname;
                var balance=result[i].balance;
                cb(200,fname,balance)
              }
            }else{
              cb(0,0,0)
            }
            connection.release();
          }
        });
      }
    }); 
  });
  socket.on('get-wallet-agent', function(walletId,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('SELECT * FROM wallets WHERE walletId=? AND agent=?',[walletId,'yes'],function(error,result){
          if (!error) {
            if (result.length>0) {
              for (var i = 0; i < result.length; i++){
                var fname=result[i].fname;
                var balance=result[i].balance;
                cb(200,fname,balance)
              }
            }else{
              cb(0,0,0)
            }
            connection.release();
          }
        });
      }
    }); 
  });
  socket.on('wallet-send', function(transactor,receiver,amount,newWalletBalance,newReceiverBal,approvalCode,transactionDate,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('UPDATE wallets SET ? WHERE ?', [{ balance: newWalletBalance}, { walletId: transactor }],function(err,result){});
        connection.query('UPDATE wallets SET ? WHERE ?', [{ balance: newReceiverBal}, { walletId: receiver }],function(err,result){});
        connection.query('INSERT INTO walletTransactions SET ?', {transactor:transactor, receiver:receiver, amount:amount, transactionType:'SEND MONEY', transactionDate:transactionDate, approvalCode:approvalCode}, function (err, results, fields) {
          connection.release();
          if (!err) {
            cb(200);
          }else{
            cb(0)
          }
        });
      }
    }); 
  });
  socket.on('wallet-agent-deposit', function(currentWalletId,agent,amount,newWalletBalance,approvalCode,transactionDate){
    io.sockets.emit('wallet-agent-deposit',currentWalletId,agent,amount,newWalletBalance,approvalCode,transactionDate);
  });
  socket.on('wallet-withdraw', function(currentWalletId,agent,amount,newWalletBalance,approvalCode,transactionDate){
    io.sockets.emit('wallet-withdraw', currentWalletId,agent,amount,newWalletBalance,approvalCode,transactionDate);
    console.log('yes bosssssssssssssssssssssssssssssssss')
  });
  socket.on('wallet-agent-deposit-authorize', function(walletId,agent,amount,newWalletBalance,approvalCode,transactionDate,cb){
    updateWallet(amount,newWalletBalance,walletId,transactionDate,approvalCode,agent,cb)
  })
  socket.on('wallet-agent-withdraw-authorize', function(walletId,agent,amount,newWalletBalance,approvalCode,transactionDate,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('UPDATE wallets SET ? WHERE ?', [{ balance: newWalletBalance}, { walletId: walletId }],function(err,result){
          connection.query('INSERT INTO walletTransactions SET ?', {transactor:walletId, receiver:'RUSH WALLET', amount:amount, transactionType:'WITHDRAW', transactionDate:transactionDate, approvalCode:approvalCode, authorizedBy:agent}, function (err, results, fields) {
            rushWalletBal(function(balance,totalBal){
              var newRushBal = parseFloat(balance);
              var newRushTotalBal = parseFloat(totalBal) - parseFloat(amount);
              connection.query('UPDATE wallets SET ? WHERE ?', [{ balance: newRushBal, fname:newRushTotalBal}, { walletId: 'BI762412' }],function(err,result){
                connection.release();
                if (!err) {
                  io.sockets.emit('wallet-withdraw-success', amount,newWalletBalance,walletId,approvalCode);
                  cb(200);
                }else{
                  cb(0)
                }
              });
            })
          });
        });
      }
    }); 
  });
  socket.on('update-item', function(itemName, itemDesc,itemBuying, itemSelling, itemQuantity, shopId, itemId, cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('UPDATE items SET ? WHERE ?', [{ itemName: itemName, itemDesc: itemDesc, itemBuying: itemBuying, itemSelling: itemSelling, itemQuantity: itemQuantity}, { id: itemId }],function(err,result){
          if (!err) {
            cb(200)
          }else{
            cb(0);
          }
          connection.release();
        });
      }
    });
  })
  socket.on('get-manage-item', function(barcode,shopId,cb){
    pool.getConnection(function(err,connection){  
      if (!err) {
        connection.query('SELECT * FROM items WHERE itemBarcode=? AND shopId=?',[barcode,shopId],function(error,result){
          if (!error) {
            if (result.length>0) {
              for (var i = 0; i < result.length; i++){
                var id=result[i].id;
                var itemName=result[i].itemName;
                var itemDesc=result[i].itemDesc;
                var itemSelling=result[i].itemSelling;
                var itemQuantity=result[i].itemQuantity;
                var itemBuying=result[i].itemBuying;
                if (parseFloat(itemQuantity)>0) {
                  cb(200,itemName,itemDesc,itemSelling,id,itemBuying,itemQuantity,itemDesc);
                }else{
                  cb('we do not have '+itemName+' anymore!',0,0,0,0,0)
                }
              }
            }else{
              cb('There is no such barcode in the system!',0,0,0,0,0)
            }
          }
          connection.release();
        });
      }
    });
  });
  socket.on('remove-item', function(itemId,cb){
    console.log(itemId+' to be removed');
    pool.getConnection(function(err,connection){  
      if (!err) {
        connection.query('DELETE FROM items WHERE id=?',[itemId],function(error,result){
          if (!error) {
            cb(200)
          }
          connection.release();
        });
      }
    });
  });
  socket.on('get-most-purchased', function(shopId){
    pool.getConnection(function(err,connection){  
      if (!err) {
        connection.query('SELECT * FROM mostitems WHERE shopId=? ORDER BY itemQuantity DESC',[shopId],function(error,result){
          if (!error) {
            if (result.length>0) {
              for (var i = 0; i < result.length; i++){
                (function(x){
                   setTimeout(function () {
                      var itemId=result[x].itemId;
                      var itemQuantity=result[x].itemQuantity;
                      getItemById(itemId,connection,function(itemName,itemSelling,itemBuying){
                        console.log('i have found '+itemId+' '+itemName+' '+itemQuantity+' '+itemSelling+' '+itemBuying);
                        socket.emit('get-most-purchased', itemId,itemQuantity,itemName,itemSelling,itemBuying);
                      });
                   }, 500 * i);
                })(i);
              }
            }
          }
          connection.release();
        });
      }
    });
  });
  socket.on('shop-add-user', function(fname,position,userId,shopId,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('INSERT INTO shopusers SET ?', {fname:fname, position:position, userId:userId, shopId:shopId}, function (err, results, fields) {
          if (!err) {
            cb(200)
            getShopUsers(shopId,connection,socket);
          }
        });
      }
    });
  });
  socket.on('shop-get-users', function(shopId){
    pool.getConnection(function(err,connection){
      if (!err) {
        getShopUsers(shopId,connection,socket);
      }
    });
  });
  socket.on('log-user-in', function(userId,shopId,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('SELECT * FROM shopusers WHERE userId=? AND shopId=?',[userId,shopId],function(error,result){
          if (!error) {
            if (result.length>0) {
              for (var i = 0; i < result.length; i++){
                var position=result[i].position;
                cb(200,position)
              }
              connection.release();
            }else{
              cb(0,0)
            }
          }
        });
      }
    });
  });
  socket.on('get-order-number', function(orderNo,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('SELECT * FROM payments WHERE id=?',[orderNo],function(error,result){
          if (!error) {
            if (result.length>0) {
              for (var i = 0; i < result.length; i++){
                var itemListString=result[i].itemListString;
                var amount=result[i].amount;
                var verifiedBy=result[i].verifiedBy;
                var totalWeight=result[i].totalWeight;
                if (verifiedBy=='') {
                  cb(200,itemListString,amount,totalWeight);
                }else{
                  cb(0,'The order number provided was verified already!',0)
                }
              }
            }else{
              cb(0,'The order number provided does not exist!',0);
            }
            connection.release();
          }
        });
      }
    });
  });
  socket.on('verify-order', function(orderNo,verifiedBy,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('UPDATE payments SET ? WHERE ?', [{ verifiedBy: verifiedBy}, { id: orderNo }],function(err,result){
          if (!err) {
            cb(200)
          }else{
            cb(0)
          }
          connection.release();
        });
      }
    }); 
  });
  socket.on('findBarcodeDetails', function(barcode,cb){
    pool.getConnection(function(err,connection){  
      if (!err) {
        connection.query('SELECT * FROM items WHERE itemBarcode=? LIMIT 1',[barcode],function(error,result){
          if (!error) {
            if (result.length>0) {
              for (var i = 0; i < result.length; i++){
                var id=result[i].id;
                var itemName=result[i].itemName;
                var itemDesc=result[i].itemDesc;
                var itemSelling=result[i].itemSelling;
                var itemBuying=result[i].itemBuying;
                var itemWeight=result[i].itemWeight;
                cb(200,itemName,itemDesc,itemWeight,itemSelling,itemBuying);
              }
            }else{
              cb(0)
            }
          }
          connection.release();
        });
      }
    });
  });
  socket.on('getting-bal', function(shopId,cb){
    pool.getConnection(function(err,connection){  
      if (!err) {
        connection.query('SELECT * FROM payments WHERE shopId=? AND rushPaid=?',[shopId,'No'],function(error,result){
          if (!error) {
            if (result.length>0) {
              var amount = 0.5 * result.length;
              var rushMerchant = '234567';
              cb(200,amount,rushMerchant);
            }else{
              cb(0,0,0)
            }
          }
          connection.release();
        });
      }
    });
  });
  socket.on('shop-payment', function(shopId,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('UPDATE payments SET ? WHERE ?', [{ rushPaid: 'Yes'}, { shopId: shopId }],function(err,result){
          if (!err) {
            cb(200)
          }else{
            cb(0)
          }
          connection.release();
        });
      }
    }); 
  });
  socket.on('update-store', function(shopMerchant,shopAddress,shopName,password,shopId,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('UPDATE shops SET ? WHERE ?', [{ shopMerchant: shopMerchant, shopAddress:shopAddress, shopName:shopName, password:password}, { shopId: shopId }],function(err,result){
          if (!err) {
            cb(200)
          }else{
            cb(0)
          }
          connection.release();
        });
      }
    }); 
  });
  socket.on('save-merchant-info', function(merchantSellerId,merchantPublishableKey,merchantPrivateKey,shopId,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        connection.query('UPDATE shops SET ? WHERE ?', [{ merchantSellerId: merchantSellerId, merchantPublishableKey:merchantPublishableKey, merchantPrivateKey:merchantPrivateKey}, { shopId: shopId }],function(err,result){
          if (!err) {
            cb(200)
          }else{
            cb(0)
          }
          connection.release();
        });
      }
    }); 
  });
  socket.on('CashierID', function(CashierID,theNewCost,phoneNo,amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight){
    io.sockets.emit('CashierID-Verify', CashierID,theNewCost,phoneNo,amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight);
  });
  socket.on('cash-payment-accepted', function(CashierID,theNewCost,phone,amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight){
    //savePaymentDetails(amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight);
    io.sockets.emit('cash-payment-accepted', CashierID,theNewCost,phone,amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight);
    console.log(phone+' payment has been accepted '+currentShopId)
  });
  socket.on('finalizeCashPayment', function(amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight){
    savePaymentDetails(amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight,socket);
    console.log('Hey there look at '+buyerNumber)
  });
  socket.on('getItemOfSameMass', function(shopId,itemId,cb){
    pool.getConnection(function(err,connection){
      if (!err) {
        getItemWeight(itemId,shopId,connection,function(itemWeight,itemSelling){
          connection.query('SELECT * FROM items WHERE shopId=? AND itemWeight=?',[shopId,itemWeight],function(error,result){
            if (!error) {
              console.log('The item itemWeight is '+itemWeight)
              if (result.length>1) {
                for (var i = 0; i < result.length; i++){
                  var otherPrice=result[i].itemSelling;
                  if(parseFloat(otherPrice) > parseFloat(itemSelling)){
                    cb(true);
                  }else{
                    cb(false);
                  }
                }
              }else{
                cb(false);
              }
              connection.release();
            }
          });
        });
      }
    }); 
  });
  socket.on('search-item', function(cityInput,itemInput){
    pool.getConnection(function(err,connection){  
      if (!err) {
        connection.query("SELECT * FROM shops WHERE shopAddress LIKE ?",['%'+cityInput+'%'],function(err,result){
          if (result.length>0) {
            for (var i = 0; i < result.length; i++){
              (function(x){
                 setTimeout(function () {
                    var shopName=result[x].shopName;
                    var shopAddress=result[x].shopAddress;
                    var shopId=result[x].shopId;
                    connection.query("SELECT * FROM items WHERE itemName LIKE ? AND shopId=? ORDER BY itemSelling DESC",['%'+itemInput+'%',shopId],function(err,result){
                      if (result.length>0) {
                        for (var i = 0; i < result.length; i++){
                          var itemName=result[i].itemName;
                          var itemSelling=result[i].itemSelling;
                          var itemQuantity=result[i].itemQuantity;
                          socket.emit('item-found', shopName,shopAddress,itemName,itemSelling,itemQuantity);
                        }
                      }else{
                        socket.emit('no-results-found', 'NO RESULT FOUND !');
                      }
                    });
                 }, 200 * i);
              })(i);
            }
            connection.release()
          }else{
            socket.emit('no-results-found', 'NO RESULT FOUND !');
            connection.release();
          }
        });
      }
    });
  });
});
function getItemWeight(itemId,shopId,connection,cb){
  connection.query('SELECT * FROM items WHERE id=? AND shopId=?',[itemId,shopId],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var itemWeight=result[i].itemWeight;
          var itemSelling=result[i].itemSelling;
          cb(itemWeight,itemSelling)
        }
      }
    }
  }); 
}
function getShopUsers(shopId,connection,socket){
  connection.query('SELECT * FROM shopusers WHERE shopId=?',[shopId],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var fname=result[i].fname;
          var position=result[i].position;
          var userId=result[i].userId;
          socket.emit('shop-get-users', fname,position,userId);
        }
        connection.release();
      }
    }
  });
}
function getItemById(itemId,connection,cb){
  connection.query('SELECT * FROM items WHERE id=?',[itemId],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var itemName=result[i].itemName;
          var itemSelling=result[i].itemSelling;
          var itemBuying=result[i].itemBuying;
          cb(itemName,itemSelling,itemBuying)
        }
      }
    }
  }); 
}
function updateWallet(amount,newWalletBalance,walletId,transactionTime,approvalCode,authorizedBy,cb){
  pool.getConnection(function(err,connection){
    if (!err) {
      connection.query('UPDATE wallets SET ? WHERE ?', [{ balance: newWalletBalance}, { walletId: walletId }],function(err,result){
        connection.query('INSERT INTO walletTransactions SET ?', {transactor:walletId, receiver:'RUSH WALLET', amount:amount, transactionType:'DEPOSIT', transactionDate:transactionTime, approvalCode:approvalCode, authorizedBy:authorizedBy}, function (err, results, fields) {
          rushWalletBal(function(balance,totalBal){
            var newRushBal = parseFloat(balance);
            var newRushTotalBal = parseFloat(totalBal) + parseFloat(amount);
            connection.query('UPDATE wallets SET ? WHERE ?', [{ balance: newRushBal, fname:newRushTotalBal}, { walletId: 'BI762412' }],function(err,result){
              connection.release();
              if (!err) {
                if (authorizedBy!=walletId) {
                  io.sockets.emit('wallet-deposit-success', amount,newWalletBalance,walletId,approvalCode);
                }
                cb(200);
              }else{
                cb(0)
              }
            });
          })
        });
      });
    }
  }); 
}
function getShopName(shopId,cb){
  pool.getConnection(function(err,connection){  
    connection.query('SELECT * FROM shops WHERE shopId=?',[shopId],function(error,result){
      if (!error) {
        if (result.length>0) {
          for (var i = 0; i < result.length; i++){
            var shopName=result[i].shopName;
            cb(shopName)
          }
        }
      }
      connection.release();
    });
  }); 
}
function rushWalletBal(cb){
  pool.getConnection(function(err,connection){  
    connection.query('SELECT * FROM wallets WHERE walletId=?',['BI762412'],function(error,result){
      if (!error) {
        if (result.length>0) {
          for (var i = 0; i < result.length; i++){
            var balance=result[i].balance;
            var totalBal=result[i].fname;
            cb(balance,totalBal)
          }
        }
      }
    });
  }); 
}
app.get("/",function(req,res){
  //res.sendFile(__dirname+"/freenetserver/index.html"); 5229 0200 8203 1842  08/21   040 Maggie Moyana
  /*
  cremora, 2kg maq, 2l cooking oil, stay soft, 3 bathing soap
  */
})
function savePaymentDetails(amount,shopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight,socket){
  console.log('we here now ah')
  pool.getConnection(function(err,connection){  
    if (!err) {
      connection.query('INSERT INTO payments SET ?', {amount:amount, shopId:shopId, itemListString:itemListString, buyerNumber:buyerNumber, initAmount:initAmount, purchaseDay:purchaseDay, verifiedBy:'', totalWeight:totalWeight, rushPaid:'No'}, function (err, results, fields) {
        if (!err) {
          console.log(buyerNumber+' has paid R'+amount+' to '+shopId);
          socket.emit('payment-success',buyerNumber);
          updateQuantity(shopId,itemListString,connection);
        }
      });
    }
  });
}
function updateQuantity(shopId,itemListString,connection){
  var itemListStringToArray=JSON.parse(itemListString);
  for (var i = 0; i < itemListStringToArray.length; i++){
    (function(x){
       setTimeout(function () {
          var id=itemListStringToArray[x].id;
          var quantity=itemListStringToArray[x].quantity;
          getItemQuantity(id,connection,function(currentQuantity){
            var itemQuantity = parseFloat(currentQuantity) - parseFloat(quantity);
            connection.query('UPDATE items SET ? WHERE ?', [{ itemQuantity: itemQuantity}, { id: id }],function(err,result){
              if (!err) {
                console.log('item id '+id+' quantity was updated');
              }else{
                console.log(err)
              }
            });
          });
          mostPurchasedItems(id,connection,function(currentQuantity){
            var itemQuantity = parseFloat(currentQuantity) + parseFloat(quantity);
            connection.query('DELETE FROM mostitems WHERE itemId=?',[id],function(error,result){});
            connection.query('INSERT INTO mostitems SET ?', {itemQuantity:itemQuantity, shopId:shopId, itemId:id}, function (err, results, fields) {
              if (!err) {
                console.log('item id '+id+' has been added to mostitems table');
              }
            });
          })
       }, 500 * i);
    })(i);
  }
  connection.release();
}
function getItemQuantity(itemId,connection,cb){
  connection.query('SELECT * FROM items WHERE id=?',[itemId],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var itemQuantity=result[i].itemQuantity;
          cb(itemQuantity);
        }
      }
    }
  }); 
}
function mostPurchasedItems(itemId,connection,cb){
  connection.query('SELECT * FROM mostitems WHERE itemId=?',[itemId],function(error,result){
    if (!error) {
      if (result.length>0) {
        for (var i = 0; i < result.length; i++){
          var itemQuantity=result[i].itemQuantity;
          cb(itemQuantity);
        }
      }else{
        cb(0)
      }
    }
  }); 
}
app.use('/files',require("express").static(__dirname + '/freenetserver'));
http.listen(9000, function() {
  console.log("Listening on 9000");
  pool.getConnection(function(err,connection){  
    if (!!err) {
      console.log("database Access Denied");
    }else{
      connection.release();
      console.log("database Access granted");//forever start --spinSleepTime 10000 index.js zep2244825
    }
  });
});
