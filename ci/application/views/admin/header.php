<?php
	if (!isset($page))
		$page = '';
	
	if (isset($pages[$page]))
		$config = $pages[$page];
	else
		$config = array();
	
	$view = isset($config['view']) ? $config['view'] : 'single';
	$theme = isset($config['theme']) ? $config['theme'] : NULL;
	$title = isset($config['title']) ? $config['title'] : ucwords($page);
	
	$GLOBALS['page'] = $page;
	$GLOBALS['view'] = $view;
	$GLOBALS['clock_address'] = $clock_address;
	
	function get_menu_class($item) {
		$page = $GLOBALS['page'];
		
		if ($page == $item)
			return ' class="current"';
		else 
			return '';
	}
	
	function get_styles($styles, $theme = NULL) {
		$page = $GLOBALS['page'];
		$root = $_SERVER['DOCUMENT_ROOT'];
		
		$css_base = '/css/';
		$search_paths = array($css_base);
		if (!is_null($theme))
			array_unshift($search_paths, $css_base . $theme . '/');
		
		$sheets = array_merge(
				array('admin/base.css', 'admin/theme.css', 'admin/chosen.css', 'admin/' . $page . '.css'),
				$styles);
		
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
	
	function get_scripts($scripts) {
		$page = $GLOBALS['page'];
		$clock_address = $GLOBALS['clock_address'];
		$js_base = '/js/';
		$root = $_SERVER['DOCUMENT_ROOT'];
		
		$scripts = array_merge(
				array('jquery.min.js', 'es5-shim.js', 'bigscreen.min.js', 'prefixfree.min.js',
					'chosen.jquery.js', 'jquery.simplemodal.js', 'jquery.single.js', 'spin.js',
					'admin/base.js', 'admin/navbar.js', 'admin/' . $page . '.js'),
				$scripts);
		
		$files = array();
		
		
		foreach ($scripts as $script) {
			if (strpos($script, 'clock:') !== false) {
				$files[] = $clock_address . substr($script, 6);
			} else {
				if (file_exists($root . $js_base . $script)) {
					$files[] = $js_base . $script;
				}
			}
		}
		
		return $files;
	}

?>
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>JSDC Admin - <?= $title ?></title>
	
	<?php foreach (get_styles($styles, $theme) as $css) : ?>
		<?= link_tag($css); ?>
	<?php endforeach; ?>
	
	<?php echo link_tag('favicon.png', 'icon', 'image/png') ?>
	
	<?php foreach (get_scripts($scripts) as $js) : ?>
		<script src="<?= $js ?>"></script>
	<?php endforeach; ?>
		
	<script>
		jsdc.baseurl = '<?= site_url() ?>';
		jsdc.clock.baseUrl = '<?= $clock_address ?>';
		jsdc.authenticate('JSDC4Life');
	</script>
</head>
<body class="<?= $page . ' ' . $view ?>">
	<header id="branding">
		<h1>
			<a href="<?= site_url('admin/') ?>">JSDC Admin</a>
		</h1>

		<nav class="x-large">
			<ul class="horizontal">
				<?php foreach ($pages as $name => $info) : ?>
					<li<?= get_menu_class($name) ?>>
						<?php if ($name == $page): ?>
							<a>
						<?php else: ?>
							<a href="<?= site_url('admin/' . $name) ?>">
						<?php endif; ?>
						<?= isset($info['title']) ? $info['title'] : ucfirst($name) ?></a>
					</li>
				<?php endforeach; ?>
			</ul>
			<div class="scroll-left symbol">&#xe096;</div>
			<div class="scroll-right symbol">&#xe097;</div>
		</nav>
		
	</header>
	<div id="content">