import os
import cfg
import fileinput

def fix_config():
	file = os.path.join(cfg.config_path, 'config.php')
	if os.path.exists(file):
		print('Modifying config.php')
		for line in fileinput.FileInput(file, inplace=True):
			line = cfg.replace(line, 'index_page', '')
			print(line, end='')
	else:
		print('config.php is missing. Is CodeIgniter installed properly?')


def fix_rest():
	file = os.path.join(cfg.config_path, 'rest.php')
	if os.path.exists(file):
		print('Modifying rest.php')
		for line in fileinput.FileInput(file, inplace=True):
			line = cfg.replace(line, 'rest_keys_table', 'apikeys')
			line = cfg.replace(line, 'rest_enable_keys', 'TRUE', quotes=False)
			line = cfg.replace(line, 'rest_key_column', 'key')
			line = cfg.replace(line, 'rest_key_length', 40)
			print(line, end='')
	else:
		print('rest.php is missing. Is CodeIgniter REST Server installed properly?')

if __name__ == '__main__':
	cfg.set_wd()
	fix_config()
	fix_rest()
	cfg.reset_wd()