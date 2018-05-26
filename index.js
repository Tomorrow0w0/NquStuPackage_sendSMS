// firestore init
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
// You should replae databaseURL with your own
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "......"
});
var db = admin.firestore();

// nexmo init
const Nexmo = require('nexmo');
const nexmo = new Nexmo({
  apiKey: '.....',
  apiSecret: '.....'
}, {debug: true});

var ph
let countryCode = "+886"
var country_ph

db.collection("Mailroom")
  .onSnapshot(function(doc) {
      db.collection('Mailroom').where("sms_info", "==", "SMS未發送")
        .get().then(snapshot => {
          snapshot.forEach(doc => {
              ph = doc.data().phone
              country_ph = countryCode + ph.substring(1)
              IfInAuthList(country_ph,doc.data().pg_No)
          });
      })
      .catch(err => {
          console.log('Error getting documents', err);
      })
 })

function IfInAuthList(ph_val,pg_val){
   admin.auth().getUserByPhoneNumber(ph_val)
         .then(function(userRecord) {
             IfUpdatePackage(userRecord.phoneNumber,pg_val)
          })
          .catch(function(error) {
                //console.log("Error fetching user data:", error);
           }); 
}

function IfUpdatePackage(ph_val,pg_val){
    db.collection("students").doc(ph_val).collection("package")
       .where("pg_No", "==", pg_val)
      .get().then(querySnapshot => {
          querySnapshot.forEach(doc => {
               SendSMS(ph_val,doc.data().pg_No,doc.data().contents)             
          })
      })
}


function SendSMS(ph_val,pg_val,co_val){
    
     db.collection("Mailroom").where("pg_No", "==", pg_val)
          .get().then(querySnapshot => {
          querySnapshot.forEach(doc => {
            doc.ref.update({
              "sms_info": "SMS已發送"
            })
            .then(() => {
                var push_ph = ph_val.substring(1)
                var SMStext = "您的物品: "+co_val+"，已到NQU收發室了!"
                nexmo.message.sendSms(
                'YOURVURTUALNUMBER', push_ph, SMStext, { type: 'unicode' },
                  (err, responseData) => {
                    if (err) {
                      console.log(err);
                    } else {
                      //console.dir(responseData);
                      console.log("已向"+push_ph+"發送SMS");
                      console.log(SMStext);
                    }
                  }
               )  
            })
          })
        })
}

 