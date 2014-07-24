#!/bin/sh

start_date=`date '+%Y/%m/%d %H:%M:%S'`
argv=("$@")
current_dir=`pwd`
result=""

echo -e "\n########## START Compile [${start_date}] ##########\n"
echo "<<TARGET>>"
for i in `seq 1 $#`
do
  echo "  ${argv[$i-1]}"
done

echo -e "\n"

for i in `seq 1 $#`
do
  dir=${argv[$i-1]}
  cd $current_dir
  if [ -e $dir ]; then
    cd $dir
    pwd
    if [ `uname` = "Darwin" ]; then
      compass compile -c ./config.rb --time
    else
      compass.bat compile -c ./config.rb --time
    fi
    if [ $? -eq 0 ]; then
      res="  \e[32m[ SUCCESS($?) ]\e[m ${dir}\n"
      touch ./mod.css
      chmod a+r ./mod.css
    else
      res="  \e[31m[ ERROR($?) ]\e[m   ${dir}\n"
    fi
  else
    res=" \e[31m[ DIRECTORY IS NOT FOUND ]\e[m ${dir}\n"
  fi
  echo -e $res
  result=$result$res
done
echo -e "\n<<RESULT>>\n$result"
end_date=`date '+%Y/%m/%d %H:%M:%S'`
echo -e "\n########## END Compile [${end_date}] ##########\n"
echo "START ${start_date} ~ END ${end_date}"

exit 0