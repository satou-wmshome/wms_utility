module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    wms_config: grunt.file.readJSON('wms_conf.json'),
    wms_pw: grunt.file.readJSON('pw.json'),
    os: require('os').platform(),
    csso: {
      wms: {
        options: {
          restructure: false
        },
        files: {
          './mod.css': ['./mod.css']
        }
      }
    },
    autoprefixer: {
      wms: {
        options: {
          browsers: ['last 2 version', 'ie >= 8']
        }
      }
    },
    exec: {
      wms_rsync: {
        cmd: function(param1, param2, param3) {
          if(param3 == null) {
            console.log('xxx');
            return false;
          }
          var g_cnf = grunt.config();
          var wms_data = getAssetsData(g_cnf, param1, param2, param3);

          var cmd = './wms_rsync.sh';
          cmd = (g_cnf.os === 'win32') ? 'bash ' + cmd : cmd;

          if(wms_data.bless) {
            cmd = 'blessc ' + wms_data.target_assets.css + ' --force && ' + cmd;
          }
          var opt = '';
          opt += ' ' + wms_data.env.host;
          opt += ' ' + wms_data.env.username;
          opt += ' ' + wms_data.env.password;
          opt += ' ' + wms_data.target_assets.css;
          opt += ' ' + wms_data.target_assets.img;
          opt += ' ' + wms_data.target_assets.remote_path;
          opt += ' ' + wms_data.env.private_key;
          // console.log(cmd);
          return cmd + opt;
        }
      }
    },
    watch: {
      options: {
        spawn: false
      }
    }
  });

  grunt.registerTask('bless', 'wms', function(param1, param2, param3) {
    if(param3 == null) {
      console.log('xxx');
      return false;
    }

    var g_cnf = grunt.config();
    var wms_data = getAssetsData(g_cnf, param1, param2, param3);

    var cmd = 'blessc ' + wms_data.target_assets.css + ' --force';
    execCommand(this, cmd);
  });

  grunt.registerTask('rsync', 'wms', function(param1, param2, param3) {
    if(param3 == null) {
      console.log('xxx');
      return false;
    }

    var g_cnf = grunt.config();
    var wms_data = getAssetsData(g_cnf, param1, param2, param3);

    var cmd = './wms_rsync.sh';
    cmd = (g_cnf.os === 'win32') ? 'bash ' + cmd : cmd;

    var opt = '';
    opt += ' ' + wms_data.env.host;
    opt += ' ' + wms_data.env.username;
    opt += ' ' + wms_data.env.password;
    opt += ' ' + wms_data.target_assets.css;
    opt += ' ' + wms_data.target_assets.img;
    opt += ' ' + wms_data.target_assets.remote_path;
    opt += ' ' + wms_data.env.private_key;

    execCommand(this, cmd + opt, 20000);
  });

  grunt.registerTask('wms_upload', 'wms', function(param1, param2, param3) {
    if(param3 == null) {
      console.log('xxx');
      return false;
    }

    var g_cnf = grunt.config();
    var args = param1 + ':' + param2 + ':' + param3;
    var wms_data = getAssetsData(g_cnf, param1, param2, param3);
    g_cnf.autoprefixer.wms.src = wms_data.target_assets.css;
    if(param3 == 'sp') {
      g_cnf.autoprefixer.wms.options.browsers = ['ios >= 5', 'android >= 2.2'];
    }
    grunt.initConfig(g_cnf);
    // grunt.task.run('autoprefixer', 'exec:wms_rsync:' + args);
    if(wms_data.bless) {
      var tasks = ['autoprefixer', 'bless:' + args, 'rsync:' + args];
    } else {
      var tasks = ['autoprefixer', 'rsync:' + args];
    }
    grunt.task.run(tasks);
  });

  grunt.registerTask('wms_watch_upload', 'wms', function(param1, param2, param3) {
    if(param3 == null) {
      console.log('xxx');
      return false;
    }

    var g_cnf = grunt.config();
    var args = param1 + ':' + param2 + ':' + param3;
    var wms_data = getAssetsData(g_cnf, param1, param2, param3);
    g_cnf.watch.files = wms_data.target_assets.css;
    // g_cnf.watch.tasks = ['autoprefixer', 'exec:wms_rsync:' + args ];
    if(wms_data.bless) {
      var tasks = ['autoprefixer', 'bless:' + args, 'rsync:' + args];
    } else {
      var tasks = ['autoprefixer', 'rsync:' + args];
    }
    g_cnf.watch.tasks = tasks;
    grunt.initConfig(g_cnf);
    grunt.task.run('watch');
  });

  grunt.event.on('watch', function(action, filepath) {
    var tmp = grunt.cli.tasks[0];
    tmp = tmp.split('wms_watch_upload:')[1];
    args = tmp.split(':');
    grunt.config('autoprefixer.wms.src', filepath);
    if(args[2] == 'sp' ) {
      grunt.config('autoprefixer.wms.options.browsers', ['ios >= 5', 'android >= 2.2']);
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  // grunt.loadNpmTasks('grunt-csso');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-exec');
};

function getAssetsData(cnf, param1, param2, param3) {
  var res = {};
  switch(param2) {
    case 'A1-1':
      var tmp = cnf.wms_config.theme.A1_1;
      break;
    case 'A1-2':
      var tmp = cnf.wms_config.theme.A1_2;
      break;
    case 'A1-3':
      var tmp = cnf.wms_config.theme.A1_3;
      break;
    default:
      break;
  }
  switch(param3) {
    case 'pc':
      res['target_assets'] = tmp.pc;
      res['bless'] = true;
      switch(param1) {
        case 'dev':
          res['env'] = cnf.wms_config.dev;
          res['env']['password'] = cnf.wms_pw.dev;
          res['target_assets']['remote_path'] = tmp.pc.dev_path;
          break;
        case 'pre_stg':
          res['env'] = cnf.wms_config.pre_stg;
          res['env']['password'] = cnf.wms_pw.pre_stg;
          res['target_assets']['remote_path'] = tmp.pc.pre_stg_path;
          break;
        default:
          break;
      }
      break;
    case 'sp':
      res['target_assets'] = tmp.sp;
      res['bless'] = false;
      switch(param1) {
        case 'dev':
          res['env'] = cnf.wms_config.dev;
          res['env']['password'] = cnf.wms_pw.dev;
          res['target_assets']['remote_path'] = tmp.sp.dev_path;
          break;
        case 'pre_stg':
          res['env'] = cnf.wms_config.pre_stg;
          res['env']['password'] = cnf.wms_pw.pre_stg;
          res['target_assets']['remote_path'] = tmp.sp.pre_stg_path;
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
  return res;
}

function execCommand(obj, cmd, timeout_ms) {
  var options_flg = timeout_ms === undefined ? false : true;

  var exec = require('child_process').exec;
  var done = obj.async();
  var options = { timeout: timeout_ms };
  var callback = function(error, stdout, stderr) {
    if(error) {
      console.log('ERR', error, stderr);
      done(false);
    } else {
      console.log(stdout);
      done();
    }
  }
  var res = options_flg ? exec(cmd, options, callback) : exec(cmd, callback);
  return res;
}