var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('PmlvhA8_RFzLIpbQkBBntA');

var csvFile = fs.readFileSync("friend_list.csv","utf8");
var emailTemplate = fs.readFileSync("email_template.html.ejs","utf8");
var blogPostInfo = [];  // empty array, global
blogPostInfo.asdf = "ANdy"

function csvParse(csvFile) {
   var csvArray = [];
   var textArray = csvFile.split("\n");

   // assume it has a header row
   for( var x=1; x<textArray.length; x++) {
      var line = textArray[x].split(",");
      var lineObj = {};
      lineObj["firstName"] = line[0];
      lineObj["lastName"] = line[1];
      lineObj["numMonthsSinceContact"] = line[2];
      lineObj["emailAddress"] = line[3];
      csvArray.push(lineObj);
   }
   return csvArray;
}



// ******** tumblr api stuffs ********
// Authenticate via OAuth
var client = tumblr.createClient({
  consumer_key: 'QwOvTJtPwzR3xkUHdWbUgo5AX50DfTCV0GibsbfYxYadIXqnmJ',
  consumer_secret: 'CQF3Z8LGQA1EehjUtF84t6DgSqsB0L05X9kvkASikCql2keShq',
  token: 'VtdFGHahkYROLS2J8HCybbKDtAPwNDceQlHPDD9FjFK53HP8CF',
  token_secret: '4a1wIwaVquvEg68rRXN84A8cVggARe17EXzO6jlTSdv1iejy81'
});

client.posts('tackypinkflamingo.tumblr.com', function(err, blog){
  //console.log(blog);
  var latestPosts = [];
  var blogsArray = blog["posts"];
  blogsArray.forEach(function(blog) {
     var blogDate = blog["date"];
     if( isDateValid(blogDate)) {
        var thisBlog = [];
        if("title" in blog) {
           // title exists
           thisBlog.title = blog["title"]
        } else {
           thisBlog.title = blog["type"] + " post";
        }
        thisBlog.href = blog["post_url"];
        latestPosts.push(thisBlog);
     }
  });

  // i was having trouble getting the blog title/href out of this function,
  // so moving the parse/render/email to in here
  // not the right way to do it, but works for now
  var friendList = csvParse(csvFile);
  friendList.forEach(function(row){
     // create input for ejs function
     row.latestPosts = latestPosts;

     // run ejs function -> template
     var email_html = ejs.render(emailTemplate, row)

     // send email
     sendEmail(row["firstName"], row["emailAddress"], "Andy", "ajstocchetti@gmail.com", "Check out my Fullstack Tumblr!", email_html);
  });
});



// ******** mandril email  ********
function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }




function isDateValid(dateString) {
   var oneWeekAgo = new Date();
   oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
   var blogDate = dateString.split(" ");
   blogDate = new Date(blogDate[0]);
   if(blogDate>oneWeekAgo) {
      return true;
   } else {
      return false;
   }
}
