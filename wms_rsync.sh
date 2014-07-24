#!/bin/sh

HOST=$1
USERNAME=$2
PASSWORD=$3
CSS_DIR_PATH=$4
IMG_DIR_PATH=$5
JSON_DIR_PATH="${CSS_DIR_PATH}../"
TXT_DIR_PATH="${JSON_DIR_PATH}../"
DIST_PATH=$6
PRIVATE_KEY=$7

function wmsRsync() {
  arg=$1
  unset opt
  case $arg in
    "css" )
      local_path=$CSS_DIR_PATH
      remote_path=$DIST_PATH
      opt="--include=mod*.css --include=admin.css --exclude=*"
      ;;
    "img" )
      local_path=$IMG_DIR_PATH
      remote_path="${DIST_PATH}img/"
      opt="--exclude=.DS_Store --exclude=.svn"
      ;;
    "json" )
      local_path=$JSON_DIR_PATH
      remote_path="${DIST_PATH}../"
      opt="--include=theme.json --include=thumb.png --exclude=*"
      ;;
    "txt" )
      local_path=$TXT_DIR_PATH
      remote_path=$DIST_PATH
      opt="--include=layout.txt --include=layout.css --exclude=*"
      ;;
    * ) break ;;
  esac
  if [ -n "${PRIVATE_KEY}" ]; then
    opt="${opt} -e \"ssh -i ${PRIVATE_KEY}\""
  fi

  echo "host= ${HOST}"
  echo "username= ${USERNAME}"
  # echo "password= ${PASSWORD}"
  echo "private_key= ${PRIVATE_KEY}"
  echo "local_path= ${local_path}"
  echo "remote_path= ${remote_path}"
  echo "opt= ${opt}"
  echo -e "\n"
  # exit

  expect -c "
    set timeout 10
    spawn rsync -av --chmod=a+rwx,o-w,Fo-x ${opt} ${local_path} ${USERNAME}@${HOST}:${remote_path}
    expect \"Are you sure you want to continue connecting (yes/no)?\" {
      send \"yes\n\"
      expect \"${HOST}'s password:\"
      send \"${PASSWORD}\n\"
    } \"${HOST}'s password:\" {
      send \"${PASSWORD}\n\"
    } \"Enter passphrase for key\" {
      send \"${PASSWORD}\n\"
      expect \"Last login\"
      send \"ls -l\n\"
    }
    interact
  "
}

##### MAIN #####
echo -e "\n########## START Rsync [`date "+%Y/%m/%d %H:%M:%S"`] ##########\n"

css_files="${CSS_DIR_PATH}mod*.css"
for css_file in ${css_files}
do
  chmod a+r $css_file
  chmod g+w $css_file
done

wmsRsync "css"
wmsRsync "txt"
wmsRsync "img"
wmsRsync "json"

echo -e "\n########## END Rsync [`date "+%Y/%m/%d %H:%M:%S"`] ##########\n"

exit 0
