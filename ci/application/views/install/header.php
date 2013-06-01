<?php
	function get_styles() {
		$root = $_SERVER['DOCUMENT_ROOT'];
		
		$css_base = '/css/';
		$search_paths = array($css_base);
		
		$sheets = array('admin/base.css', 'admin/install.css', 'admin/chosen.css');
		$files = array();
		
		foreach ($sheets as $sheet) {
			foreach ($search_paths as $search) {
				if (file_exists($root . $search . $sheet)) {
					$files[] = $search . $sheet;
					break;
				}
			}
		}
		
		return $files;
	}
	
	function get_scripts() {
		$js_base = '/js/';
		$root = $_SERVER['DOCUMENT_ROOT'];
		
		$scripts = array('jquery.min.js', 'es5-shim.js', 'prefixfree.min.js',
				'chosen.jquery.js', 'jquery.simplemodal.js', 'jquery.single.js', 
				'spin.js', 'admin/base.js', 'install/install.js');
		
		$files = array();
		
		foreach ($scripts as $script) {
			if (file_exists($root . $js_base . $script)) {
				$files[] = $js_base . $script;
			}
		}
		
		return $files;
	}

?>
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>JSDC Admin Installation</title>
	
	<?php foreach (get_styles() as $css) : ?>
		<?= link_tag($css); ?>
	<?php endforeach; ?>
	
	<?php echo link_tag('favicon.png', 'icon', 'image/png') ?>
	
	<?php foreach (get_scripts() as $js) : ?>
		<script src="<?= $js ?>"></script>
	<?php endforeach; ?>
		
	<script>
		jsdc.baseurl = '<?= site_url() ?>';
	</script>
</head>
<body class="full">
	<header id="branding">
		<h1>JSDC Admin Installation</h1>
	</header>
	<div id="content">