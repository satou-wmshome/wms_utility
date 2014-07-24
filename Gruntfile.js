module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    wms_config: grunt.file.readJSON('wms_conf.json'),
    wms_pw: grunt.file.readJSON('pw.json'),
    os: require('os').platform(),
    autoprefixer: {
      pc: {
        options: {
          browsers: ['last 2 version', 'ie >= 8']
        }
      },
      sp: {
        options: {
          browsers: ['ios >= 5', 'android >= 2.2']
        }
      }
    },
    exec: {
      compile: {
        cmd: function(pBranch, pSVNDir, pSibling, pLayout) {
          if(pSVNDir == null || pSVNDir == '') {
            console.error('xxx');
            return false;
          }

          var g_cnf = grunt.config();
          var branch = (pBranch == null || pBranch == '' || pBranch == 'trunk') ? 'trunk' : 'branches/' + pBranch;
          var theme = pSVNDir;
          var theme_path = g_cnf.wms_config.svn_dir[theme];
          var siblings = (pSibling == null || pSibling == '') ? ['a1'] : g_cnf.wms_config.compile.sibling[pSibling];
          var layouts = (pLayout == null || pLayout == '') ? ['L25'] : g_cnf.wms_config.compile.layout[pLayout];

          var args_arr = [];
          for(var i=0; i<layouts.length; i++) {
            var dir_name1 = theme + '-' + layouts[i] + '/';
            var media = (layouts[i] !== 'Num') ? 'pc/' : 'sp/';
            for(var n=0; n<siblings.length; n++) {
              var dir_name2 = theme + siblings[n] + '-' + layouts[i] + '/';
              args_arr.push(theme_path + branch + '/v10/theme_scss/' + dir_name1 + dir_name2 + media);
            }
          }
          var args = args_arr.join(' ');

          var cmd = './wms_compile.sh ';
          cmd = (g_cnf.os === 'win32') ? 'bash ' + cmd : cmd;

          return cmd + args;
        }
      },
      bless: {
        cmd: function(pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir) {
          if(pSVNDir == null || pSVNDir == '') {
            console.error('xxx');
            return false;
          }

          var g_cnf = grunt.config();
          var wms_data = getAssetsData(g_cnf, pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir);

          var cmd = 'blessc ' + wms_data.css_dir + 'mod.css --force';
          return cmd;
        }
      },
      rsync: {
        cmd: function(pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir) {
          if(pSVNDir == null || pSVNDir == '') {
            console.error('xxx');
            return false;
          }

          var g_cnf = grunt.config();
          var wms_data = getAssetsData(g_cnf, pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir);

          var cmd = './wms_rsync.sh';
          cmd = (g_cnf.os === 'win32') ? 'bash ' + cmd : cmd;

          var opt = [
                      '',
                      wms_data.host,
                      wms_data.username,
                      wms_data.password,
                      wms_data.css_dir,
                      wms_data.img_dir,
                      wms_data.deploy_dir,
                      wms_data.key_file
                    ].join(' ');

          return cmd + opt;
        }
      },
      shortcut: {
        cmd: function(pCmd) {
          var cmd = pCmd.replace(/\|/g, ':');
          console.log(cmd);
          return "grunt " + cmd;
        }
      }
    },
    watch: {
      options: {
        spawn: false
      }
    }
  });

  //SASSコンパイル
  grunt.registerTask('wms_compile', 'wms', function(pBranch, pSVNDir, pSibling, pLayout) {
    if(grunt.option('info')) {
      var str = Information('wms_compile');
      console.log(str);
      return true;
    }

    if(pSVNDir == null || pSVNDir == '') {
      console.error('xxx');
      return false;
    }

    var args = [pBranch, pSVNDir, pSibling, pLayout].join(':');
    var tasks = 'exec:compile:' + args;
    grunt.task.run(tasks);
  });

  //ファイルアップロード
  grunt.registerTask('wms_upload', 'wms', function(pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir) {
    if(grunt.option('info')) {
      var str = Information('wms_upload');
      console.log(str);
      return true;
    }

    if(pSVNDir == null || pSVNDir == '') {
      console.error('xxx');
      return false;
    }

    var g_cnf = grunt.config();
    var wms_data = getAssetsData(g_cnf, pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir);
    var tasks = getTasks(wms_data.media, pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir);
    g_cnf.autoprefixer.pc.src = g_cnf.autoprefixer.sp.src = wms_data.css_dir + 'mod.css';
    grunt.initConfig(g_cnf);
    grunt.task.run(tasks);
  });

  //監視 + ファイルアップロード
  grunt.registerTask('wms_watch_upload', 'wms', function(pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir) {
    if(grunt.option('info')) {
      var str = Information('wms_upload');
      console.log(str);
      return true;
    }

    if(pSVNDir == null || pSVNDir == '') {
      console.error('xxx');
      return false;
    }

    var g_cnf = grunt.config();
    var wms_data = getAssetsData(g_cnf, pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir);
    var tasks = getTasks(wms_data.media, pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir);
    g_cnf.watch.tasks = tasks;
    g_cnf.watch.files = wms_data.css_dir + 'mod.css';
    console.log('<<watch>> ' + wms_data.css_dir + 'mod.css');
    grunt.initConfig(g_cnf);
    grunt.task.run('watch');
  });

  //コマンドショートカット
  grunt.registerTask('wms_shortcut', 'wms', function(pKey) {
    var g_cnf = grunt.config();
    if(grunt.option('list') || pKey == null) {
      var obj = g_cnf.wms_config.shortcut;
      console.log('\n<<ShortCut List>> ==================================================');
      Object.keys(obj).forEach(function(key){
        var str = "grunt wms_shortcut:" + key;
        str += "   ..." + obj[key]['info'];
        str += " (" + obj[key]['cmd'] + ')';
        console.log(str);
      });
      console.log('====================================================================');
      return true;
    }

    var cmd = g_cnf.wms_config.shortcut[pKey]['cmd'].replace(/:/g, '|');
    console.log(g_cnf.wms_config.shortcut[pKey]['info']);
    grunt.task.run('exec:shortcut:' + cmd);
  });

  grunt.event.on('watch', function(action, filepath) {
    grunt.config('autoprefixer.pc.src', filepath);
    grunt.config('autoprefixer.sp.src', filepath);
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-exec');
};

//////////////////////////////////////////////////
function Information(task_name) {
  var res = '';

  var str = '\n<<Information>> ==================================================\n';
  switch(task_name) {
    case 'wms_compile':
      str +='grunt ' + task_name + ':[branch name]:[svn_dir code]:[sibling code]:[layout code]\n';
      str +='\n  ・[branch name]  : ブランチ名 (e.g. trunk)';
      str +='\n  ・[svn_dir code] : ローカルSVNディレクトリの場所/wms_conf.jsonの"svn_dir"内の値で指定 (e.g. A1-1)';
      str +='\n  ・[sibling code] : 兄弟/wms_conf.jsonの"compile.sibling"内の値で指定 (e.g. a1)';
      str +='\n  ・[sibling code] : レイアウト/wms_conf.jsonの"compile.layout"内の値で指定 (e.g. L25)';
      break;
    case 'wms_upload':
    case 'wms_watch_upload':
      str +='grunt ' + task_name + ':[branch name]:[svn_dir code]:[sibling name]:[layout name]:[environment code]:[deploy_dir code]\n';
      str +='\n  ・[branch name]      : ブランチ名 (e.g. trunk)';
      str +='\n  ・[svn_dir code]     : ローカルSVNディレクトリの場所/wms_conf.jsonの"svn_dir"内の値で指定 (e.g. A1-1)';
      str +='\n  ・[sibling name]     : 兄弟名 (e.g. a1)';
      str +='\n  ・[sibling name]     : レイアウト名 (e.g. L25)';
      str +='\n  ・[environment code] : 対象環境/wms_conf.jsonの"dev" or "pre_stg"で指定 (e.g. dev)';
      str +='\n  ・[deploy_dir code]  : アップロード先ディレクトリ/wms_conf.jsonの"deploy_dir"内の値で指定 (e.g. sample1)';
      break;
  }
  str = str + '\n=================================================================';

  res = str;
  return res;
}

function getAssetsData(cnf, pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir) {
  var res = {};

  var theme = pSVNDir;
  var branch = (pBranch == null || pBranch == '' || pBranch == 'trunk') ? 'trunk' : 'branches/' + pBranch;
  var layout = theme + '-' + pLayout + '/';
  var sibling = theme + pSibling + '-' + pLayout + '/';
  res['env'] = pEnv;
  res['host'] = cnf.wms_config[pEnv]['host'];
  res['username'] = cnf.wms_config[pEnv]['username'];
  res['password'] = cnf.wms_pw[pEnv];
  res['key_file'] = cnf.wms_config[pEnv]['key_file'];
  res['media'] = (pLayout !== 'Num') ? 'pc' : 'sp';
  res['css_dir'] = cnf.wms_config.svn_dir[theme] + branch + '/v10/theme_scss/' + layout + sibling + res['media'] + '/';
  res['img_dir'] = cnf.wms_config.svn_dir[theme] + branch + '/v10/theme_scss/' + res['media'] + '/img/';
  res['deploy_dir'] = cnf.wms_config[pEnv]['theme_root_path'] + cnf.wms_config.deploy_dir[pDeployDir] + '/' + res['media'] + '/';

  return res;
}

function getTasks(pMedia, pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir) {
  var args = [pBranch, pSVNDir, pSibling, pLayout, pEnv, pDeployDir].join(':');
  if(pMedia == 'pc') {
    var res = ['autoprefixer:' + pMedia, 'exec:bless:' + args, 'exec:rsync:' + args];
  } else {
    var res = ['autoprefixer:' + pMedia, 'exec:rsync:' + args];
  }

  return res;
}

// function execCommand(obj, cmd, timeout_ms) {
//   var options_flg = (timeout_ms === undefined) ? false : true;

//   var exec = require('child_process').exec;
//   var done = obj.async();
//   var options = { timeout: timeout_ms };
//   var callback = function(error, stdout, stderr) {
//     if(error) {
//       console.log('ERR', error, stderr);
//       done(false);
//     } else {
//       console.log(stdout);
//       done();
//     }
//   }
//   var res = options_flg ? exec(cmd, options, callback) : exec(cmd, callback);
//   return res;
// }
