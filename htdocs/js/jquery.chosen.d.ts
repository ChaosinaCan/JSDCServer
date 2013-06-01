interface ChosenOptions {
	no_results_text?: string;
	placeholder_text?: string;
	allow_single_deselect?: bool;
	disable_search_threshold?: number;
	disable_search?: bool;
	enable_split_word_search?: bool;
	search_contains?: bool;
	single_backstroke_delete?: bool;
	max_selected_options?: number;
	inherit_select_classes?: bool;
}

interface JQuery {
	chosen(options?: ChosenOptions): JQuery;
}