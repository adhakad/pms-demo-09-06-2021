var express = require('express');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var server = require('http').Server(app);
const { v4: uuidV4 } = require("uuid");
var io = require('socket.io')(server)
var { ExpressPeerServer } = require('peer');
var peerServer = ExpressPeerServer(server, {
  debug: true
});
app.use('/peerjs', peerServer);

var indexRouter = require('./routes/index');
var dashboardRouter = require('./routes/dashboard');
var teacherRouter = require('./routes/admin/teacher/teacher');
var adminPanelRouter = require('./routes/admin/admin-panel');
var adminClassTeacherRouter = require('./routes/admin/classTeacher/classTeacher');
var totalAdminClassRouter = require('./routes/admin/totalAdminClass/totalAdminClass'); 
var adminTotalClassListRouter = require('./routes/admin/totalAdminClass/totalAdminClassList');
var adminDashboardRouter = require('./routes/admin/admin-dashboard');
var adminStudentListRouter = require('./routes/admin/student/studentList');
var studentUserRouter = require('./routes/admin/student/studentUser');
var teacherAdminPanelRouter = require('./routes/adminTeacher/teacher-admin-panel');
var teacherAdminDashboardRouter = require('./routes/adminTeacher/teacher-admin-dashboard');
var getStudentUserRouter = require('./routes/studentUser/getStudentUser');

app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret:'~K]d9@5LEpD}t267',
  resave:false,
  saveUninitialized:true,
}));

var roomHost = require('./modules/roomHost');
var roomUser = require('./modules/roomUser'); 
app.get('/room/:id', (req, res) => {
  var abcd = req.params.id;
  res.redirect('/'+abcd) 
  app.get('/:id',function(req, res, next) {
    var rooms=roomHost.findOne({room_id:abcd});
    rooms.exec((err,data)=>{
      if(err) throw err;
      if(data==null)
      {
        var start_date = Date.now();
        res.render('room', {roomId: req.params.id,roomH_id:"",times:"",start_date:start_date,starts_date:""});
      }else{
        var times = 2;
        var roomH_id = data.roomH_id;
        var starts_date = data.start_date;
        res.render('room', {roomId: req.params.id,roomH_id:roomH_id,times:times,start_date:"",starts_date:starts_date});
      }
    }); 
  });
}); 

var rid = 12345;
app.delete('/'+rid+'/delete', function(req, res, next) {
  var room=roomHost.findOne({room_id:rid});
  room.exec((err,data)=>{
    if(err) throw err;
    var objid = data._id;
    var rooms=roomHost.findByIdAndDelete({_id:objid});
    rooms.exec((err,data)=>{
      var roomss=roomUser.deleteOne({room_id:rid});
      roomss.exec((err,data)=>{
        if(err) throw err;
        res.send({msgg:'/'});
      });
    });
  }) 
});

var ridd = 12345;
app.delete('/'+ridd+'/deletes', function(req, res, next) {
  var room=roomUser.findOne({room_id:ridd});
  room.exec((err,data)=>{
    if(err) throw err;
    var room_id = data.room_id;
    var rooms=roomUser.deleteOne({room_id:room_id});
    rooms.exec((err,data)=>{
      if(err) throw err;
       res.send({msg:'/'});
    });
  }) 
});

  io.on("connection", (socket) => {
    socket.on("join-room", (roomId, id,start_date) => { 
      var rooms=roomHost.findOne({room_id:roomId});
      rooms.exec((err,data)=>{
        if(err) throw err;
        if(data==null)
        {
          var roomH = new roomHost({
            room_id: roomId,
            roomH_id:id,
            start_date:start_date
          });
          roomH.save((err,doc)=>{
            if(err) throw err;
           });
        }
        var roomU = new roomUser({
          room_id: roomId,
          roomU_id:id,
        });
        roomU.save((err,doc)=>{
          if(err) throw err;
         });
      });
      socket.join(roomId);
      socket.to(roomId).broadcast.emit("user-connected", id);
      socket.on("disconnect", () => {
        socket.to(roomId).broadcast.emit("user-disconnected", id);
      });
    });
  });

app.use('/', indexRouter);
app.use('/dashboard', dashboardRouter);
app.use('/teacher', teacherRouter);
app.use('/admin-panel', adminPanelRouter);
app.use('/classTeacher', adminClassTeacherRouter);
app.use('/totalAdminClass', totalAdminClassRouter);
app.use('/totalAdminClassList', adminTotalClassListRouter);
app.use('/studentList', adminStudentListRouter);
app.use('/studentUser', studentUserRouter);
app.use('/admin-dashboard', adminDashboardRouter);
app.use('/teacher-admin-panel', teacherAdminPanelRouter);
app.use('/teacher-admin-dashboard', teacherAdminDashboardRouter);
app.use('/getStudentUser', getStudentUserRouter);


server.listen(process.env.PORT||3000)