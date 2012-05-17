#!/bin/sh
##3.5...10...15...20...25...30...35...40...45...50...55...60...65...70...75...80
## 
##  Debian / Linux / Ubuntu / LSB
##  Startup script for Express / Node.js application with the forever module
##
##
##  A modification of "init.d.lsb.ex" by Nicolas Thouvenin 
##
##
## This is free software; you may redistribute it and/or modify
## it under the terms of the GNU General Public License as
## published by the Free Software Foundation; either version 2,
## or (at your option) any later version.
##
## This is distributed in the hope that it will be useful, but
## WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
## GNU General Public License for more details.
##
## You should have received a copy of the GNU General Public License with
## the Debian operating system, in /usr/share/common-licenses/GPL;  if
## not, write to the Free Software Foundation, Inc., 59 Temple Place,
## Suite 330, Boston, MA 02111-1307 USA
##
##


################################################################################
################################################################################
##                                                                            ##
#                           APPLICATION section                                #
##                                                                            ##
################################################################################
################################################################################

# !!!
# !!! If you do not want to change the variables below.
# !!! You must, first, rename the script with the name of the directory created 
# !!! by "express" and add the suffix ".sh"
# !!! Second, you must place this script right next to the directory created 
# !!! by "express"
# !!! 
# !!! For example:
# !!! /tmp/foo      # Created by the command "express /tmp/foo"
# !!! /tmp/foo.sh   # This script 
# !!! 

APP='/home/root/Gridlock/app.js'
export NODE_ENV=${NODE_ENV:="production"}


################################################################################
################################################################################
##                                                                            ##
#                       PATHs section                                          #
##                                                                            ##
################################################################################
################################################################################


export PATH=$HOME/local/bin:${PATH:=}
export MANPATH=$HOME/local/man:${MANPATH:=}
export LD_LIBRARY_PATH=$HOME/local/lib:${LD_LIBRARY_PATH:=}


################################################################################
################################################################################
##                                                                            ##
#                       FOREVER section                                        #
##                                                                            ##
################################################################################
################################################################################


running() {
	forever list 2>/dev/null | grep ${APP} 2>&1 >/dev/null
    return $?
}

start_server() {
	forever start ${APP} 2>&1 >/dev/null
	return $?
}

stop_server() {
	forever stop ${APP} 2>&1 >/dev/null
	return $?
}

################################################################################
################################################################################
##                                                                            ##
#                       GENERIC section                                        #
##                                                                            ##
################################################################################
################################################################################

if [ -f /lib/lsb/init-functions ]
then
    . /lib/lsb/init-functions
else
    # int log_begin_message (char *message)
    log_begin_msg () {
        if [ -z "$1" ]; then
	    return 1
        fi
        echo " * $@"
    }

    # int log_end_message (int exitstatus)
    log_end_msg () {
	
    # If no arguments were passed, return
	[ -z "$1" ] && return 1
	
    # Only do the fancy stuff if we have an appropriate terminal
    # and if /usr is already mounted
	TPUT=/usr/bin/tput
	EXPR=/usr/bin/expr
	if [ -x $TPUT ] && [ -x $EXPR ] && $TPUT hpa 60 >/dev/null 2>&1; then
	    COLS=`$TPUT cols`
	    if [ -n "$COLS" ]; then
		COL=`$EXPR $COLS - 7`
	    else
		COL=73
	    fi
	    UP=`$TPUT cuu1`
	    END=`$TPUT hpa $COL`
	    START=`$TPUT hpa 0`
	    RED=`$TPUT setaf 1`
	    NORMAL=`$TPUT op`
	    if [ $1 -eq 0 ]; then
		echo "$UP$END[ ok ]"
	    else
		echo -e "$UP$START $RED*$NORMAL$END[${RED}fail${NORMAL}]"
	    fi
	else
	    if [ $1 -eq 0 ]; then
		echo "   ...done."
	    else
		echo "   ...fail!"
	    fi
	fi
	return $1
    }
    
    log_warning_msg () {
	if log_use_fancy_output; then
	    YELLOW=`$TPUT setaf 3`
	    NORMAL=`$TPUT op`
	    echo "$YELLOW*$NORMAL $@"
	else
	    echo "$@"
	fi
    }

fi


DIETIME=10              # Time to wait for the server to die, in seconds
                        # If this value is set too low you might not
                        # let some servers to die gracefully and
                        # 'restart' will not work

STARTTIME=2             # Time to wait for the server to start, in seconds
                        # If this value is set each time the server is
                        # started (on start or restart) the script will
                        # stall to try to determine if it is running
                        # If it is not set and the server takes time
                        # to setup a pid file the log message might
                        # be a false positive (says it did not start
                        # when it actually did)

case "$1" in
	start)
		log_daemon_msg "Starting $DESC " "$NAME"
		# Check if it's running first
		if running ;  then
			log_progress_msg "apparently already running"
			log_end_msg 0
			exit 0
		fi
		if start_server ; then
			# NOTE: Some servers might die some time after they start,
			# this code will detect this issue if STARTTIME is set
			# to a reasonable value
			[ -n "$STARTTIME" ] && sleep $STARTTIME # Wait some time
			if  running ;  then
				# It's ok, the server started and is running
				log_end_msg 0
			else
				# It is not running after we did start
				log_end_msg 1
			fi
		else
			# Either we could not start it
			log_end_msg 1
		fi
		;;
	stop)
		log_daemon_msg "Stopping $DESC" "$NAME"
		if running ; then
			# Only stop the server if we see it running
			errcode=0
			stop_server || errcode=$?
			log_end_msg $errcode
		else
			# If it's not running don't do anything
			log_progress_msg "apparently not running"
			log_end_msg 0
			exit 0
		fi
		;;
	restart)
		log_daemon_msg "Restarting $DESC" "$NAME"
		errcode=0
		stop_server || errcode=$?
		# Wait some sensible amount, some server need this
		[ -n "$DIETIME" ] && sleep $DIETIME
		start_server || errcode=$?
		[ -n "$STARTTIME" ] && sleep $STARTTIME
		running || errcode=$?
		log_end_msg $errcode
		;;
	status)
		log_daemon_msg "Checking status of $DESC" "$NAME"
		if running ;  then
			log_progress_msg "running"
			log_end_msg 0
		else
			log_progress_msg "apparently not running"
			log_end_msg 1
			exit 1
		fi
		;;
	*)
		echo "Usage: ${0} {start|stop|status|restart}"
		exit 1
		;;
esac

exit 0