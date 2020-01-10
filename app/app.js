var createError = require('http-errors');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var debug = require('debug')('app');

const multer = require('multer');
//for local image upload
const Storage = multer.diskStorage({
  destination(req, file, callback) {
//    callback(null, './images')
    callback(null, '/tmp')
  },
  filename(req, file, callback) {
    callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`)
  },
})

const upload = multer({ storage: Storage });

/* //experiment to local file access
var fs = require('fs');
 
var test_path = "/home/.aws";
 
fs.readdir(test_path, function(err, items) {
    console.log(items);
 
    for (var i=0; i<items.length; i++) {
        console.log(items[i]);
    }
    
});
 
fs.readFile('/home/.aws/credentials', 'utf8', function(err, contents) {
    console.log(contents);
});
*/

//AWS Image upload
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
/*
var credentials = new aws.SharedIniFileCredentials({profile: 'medt-server-account'});
aws.config.credentials = credentials;
console.log(credentials)
aws.config.getCredentials(function(err) {
  if (err) console.log(err.stack);
  // credentials not loaded
  else {
    console.log("Access key:", AWS.config.credentials.accessKeyId);
    console.log("Secret access key:", AWS.config.credentials.secretAccessKey);
  }
});
*/
//***************** TODO: use IAM for getting the keys

const ID = process.env.aws_access_key_id;
const SECRET = process.env.aws_secret_access_key;
const REGION = process.env.AWS_DEFAULT_REGION;//'us-west-2';

const BUCKET_NAME = 'meditation-metrics-kkyp-20200103';

aws.config.update({
    secretAccessKey: SECRET,
    accessKeyId: ID,
    region: REGION
});

var s3 = new aws.S3();
var StorageS3 = multerS3({
        s3: s3,
        bucket: function (req, file, cb) {
            console.log(`${BUCKET_NAME}/${file.fieldname}`);
            cb(null, `${BUCKET_NAME}/${file.fieldname}`); 
        },
        //bucket: BUCKET_NAME,
        key: function (req, file, cb) {
            console.log(file);
            cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`); 
        }
    });
var uploadS3 = multer({ storage: StorageS3 });


const todoRouter = require('./routes/todoRoutes');

var app = express();

console.log('Starting the server %s',__dirname);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
//since the npm install was done at the root directory, need  
app.use('/js', express.static(__dirname + '/../node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/../node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/../node_modules/bootstrap/dist/css')); // redirect CSS bootstrap


app.use('/css', express.static(__dirname + '/public/stylesheets'));
app.use('/webfonts', express.static(__dirname + '/public/fonts/webfonts/')); 

app.get('/', todoRouter);
app.post('/task/complete/:id', todoRouter);
app.get('/task/edit/:id', todoRouter);
app.post('/task/edit/:id', todoRouter);
app.get('/task/delete/:id', todoRouter);
app.post('/task/delete/:id', todoRouter);
app.get('/task/complete/:id', todoRouter);
app.get('/task/add/', todoRouter);
app.post('/task/add/', todoRouter);

//for image upload
app.post('/api/uploads3', uploadS3.array('photo', 3), (req, res) => {
  console.log('file', req.files)
  console.log('body', req.body)
  res.status(200).json({
    message: 'success!',
  })
})

//for image upload
app.post('/api/upload', upload.array('photo', 3), (req, res) => {
  console.log('file', req.files)
  console.log('body', req.body)
  res.status(200).json({
    message: 'success!',
  })
})

// catch favicon requests and respond
app.use('/favicon.ico', (req, res) => res.status(204));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
