interface ChosenOptions {
	no_results_text?: string;
	placeholder_text?: string;
	allow_single_deselect?: boolean;
	disable_search_threshold?: number;
	disable_search?: boolean;
	enable_split_word_search?: boolean;
	search_contains?: boolean;
	single_backstroke_delete?: boolean;
	max_selected_options?: number;
	inherit_select_classes?: boolean;
}

interface JQuery {
	chosen(options?: ChosenOptions): JQuery;
}