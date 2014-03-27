#!/bin/sh

HOST=$1
USERNAME=$2
PASSWORD=$3
CSS_PATH=$4
IMG_PATH=$5
DIST_PATH=$6
PRIVATE_KEY=$7

function wmsRsync() {
  arg=$1
  unset opt
  case $arg in
    "css" )
      path=`echo $CSS_PATH | sed -e 's/mod.css//g'`
      remote_path=$DIST_PATH
      opt="--include=mod*.css --exclude=*"
      ;;
    "img" )
      path=$IMG_PATH
      remote_path="${DIST_PATH}img/"
      opt="--exclude=.DS_Store"
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
  echo "path= ${path}"
  echo "remote_path= ${remote_path}"
  echo "opt= ${opt}"
  # echo "\n"
  # exit

  expect -c "
    set timeout 10
    spawn rsync -av ${opt} ${path} ${USERNAME}@${HOST}:${remote_path}
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

echo -e "\n########## START Rsync [`date "+%Y/%m/%d %H:%M:%S"`] ##########\n"
wmsRsync "css"
wmsRsync "img"
echo -e "\n########## END Rsync [`date "+%Y/%m/%d %H:%M:%S"`] ##########\n"

exit 0
