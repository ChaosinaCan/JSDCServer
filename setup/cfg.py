import re, os, sys

""" Generic methods for editing CodeIgniter config files """

wd = ''
config_path = '../ci/application/config/'
node_path = '../node'

def is_config_line(line, name):
	if re.match("\$config\s*\[\s*'%s'\s*\]" % name, line):
		return True
	else:
		return False

def get_config(key, value, quotes=True):
	if quotes and isinstance(value, str):
		value = "'%s'" % value.replace("'", "\\'")

	return "$config['%s'] = %s;\n" % (key, value)

def replace(line, key, value, quotes=True):
	try:
		if is_config_line(line, key):
			line = get_config(key, value, quotes)
	except Exception as e:
		print(e, file=sys.stdout)
	finally:
		return line

def set_wd():
	global wd
	wd = os.path.abspath(os.getcwd())
	os.chdir(os.path.dirname(os.path.abspath(sys.argv[0])))

def reset_wd():
	global wd
	os.chdir(wd)