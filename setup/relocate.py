import re, os, sys
import cfg
import argparse
import fileinput
from urllib.parse import urlparse

def format_address(addr):
	addr = re.sub('^(?!http://)', 'http://', addr)
	addr = re.sub('$(?<!/)', '/', addr)
	return addr

def set_server_addr(addr):
	addr = format_address(addr)
	print('Setting server location: {0}'.format(addr))

	for line in fileinput.FileInput(os.path.join(cfg.config_path, 'config.php'), inplace=True):
		line = cfg.replace(line, 'base_url', addr)
		print(line, end='')

	o = urlparse(addr)
	hostname = re.sub(':.+?$', '', o.netloc)
	port = o.port if o.port != None else 80

	inside_main_server = False
	for file in ['config.js', 'config.ts']:
		for line in fileinput.FileInput(os.path.join(cfg.node_path, file), inplace=True):
			try:
				if (inside_main_server):
					if re.match('}', line):
						inside_main_server = False
					elif re.match('^\s*host:', line):
						line = "\thost: '%s',\n" % hostname
					elif re.match('^\s*port:', line):
						line = '\tport: %s,\n' % port
				else:
					if re.match('export\s+var\s+mainServer|exports.mainServer', line):
						inside_main_server = True
			except Exception as e:
				print(e, file=sys.stdout)
			finally:
				print(line, end='')


def set_clock_addr(addr):
	addr = format_address(addr)
	print('Setting clock location: {0}'.format(addr))

	for line in fileinput.FileInput(os.path.join(cfg.config_path, 'jsdc.php'), inplace=True):
		line = cfg.replace(line, 'jsdc_clock_address', addr)
		print(line, end='')

	o = urlparse(addr)
	port = o.port if o.port != None else 80

	inside_node_server = False
	for file in ['config.ts', 'config.js']:
		for line in fileinput.FileInput(os.path.join(cfg.node_path, file), inplace=True):
			try:
				if (inside_node_server):
					if re.match('}', line):
						inside_node_server = False
					elif re.match('^\s*port:', line):
						line = '\tport: %s,\n' % port
				else:
					if re.match('export\s+var\s+nodeServer|exports.nodeServer', line):
						inside_node_server = True
			except Exception as e:
				print(e, sys.stdout)
			finally:
				print(line, end="")
	

if __name__ == "__main__":
	cfg.set_wd()
	parser = argparse.ArgumentParser(description="Changes the address of the JSDC Server")
	parser.add_argument('--here', action='store_true', help='Use the current machine\'s location for both servers')
	parser.add_argument('-s', '--server', metavar='address', help='The address of the JSDC web server')
	parser.add_argument('-c', '--clock', metavar='address', help='The address of the JSDC Node server')
	args = parser.parse_args()

	if args.here:
		import socket
		serverAddr = socket.gethostbyname(socket.getfqdn())
		clockAddr = serverAddr + ':8080'
	else:
		serverAddr = args.server
		clockAddr = args.clock

	if serverAddr == None and clockAddr == None:
		print('Enter the web server address and port. Leave blank to use current location.')
		serverAddr = input()
		print('Enter the node server address and port. Leave blank to use current location.')
		clockAddr = input()

	if serverAddr != None:
		set_server_addr(serverAddr)
	if clockAddr != None:
		set_clock_addr(clockAddr)

	cfg.reset_wd()