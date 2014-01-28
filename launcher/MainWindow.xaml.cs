using JSDC.Launcher.Applications;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;

namespace JSDC.Launcher
{
	/// <summary>
	/// Interaction logic for MainWindow.xaml
	/// </summary>
	public partial class MainWindow : Window
	{
		private const double ExpandedMinHeight = 340;
		private const double UnexpandedHeight = 245;
		private double expandedHeight = 460;
		private List<ApplicationHandler> handlers = new List<ApplicationHandler>();
		private List<string> inputHistory = new List<string>();
		private string currentInput = null;
		private int inputHistoryIndex = -1;

		public MainWindow()
		{
			InitializeComponent();

			this.MaxHeight = UnexpandedHeight;

			ApacheStatus.Handler = new ApacheHandler();
			MySqlStatus.Handler = new MySqlHandler();
			NodeStatus.Handler = new NodeHandler(console);

			handlers.Add(ApacheStatus.Handler);
			handlers.Add(MySqlStatus.Handler);
			handlers.Add(NodeStatus.Handler);

			if (!App.IsDesignMode)
			{
				Task.Factory.StartNew(StartAllApplicationsAsync);
			}
		}

		public async void StartAllApplicationsAsync()
		{
			foreach (var handler in handlers)
			{
				await Task.Factory.StartNew(() => handler.Start());
			}
		}

		private void Expander_Collapsed(object sender, RoutedEventArgs e)
		{
			this.MinHeight = UnexpandedHeight;
			this.MaxHeight = UnexpandedHeight;
			this.Height = UnexpandedHeight;
		}

		private void Expander_Expanded(object sender, RoutedEventArgs e)
		{
			this.MaxHeight = double.PositiveInfinity;
			this.Height = this.expandedHeight;

			// MinHeight must be changed last to prevent it from triggering Window_SizeChanged()
			this.MinHeight = ExpandedMinHeight;
		}

		private void input_KeyDown(object sender, KeyEventArgs e)
		{
			if (e.Key == Key.Enter && !string.IsNullOrWhiteSpace(input.Text))
			{
				currentInput = null;
				inputHistory.Add(input.Text);
				inputHistoryIndex = inputHistory.Count;
				console.WriteInput(input.Text + Environment.NewLine, true, Colors.MediumOrchid);
				input.Text = "";
			}
		}

		private void input_PreviewKeyDown(object sender, KeyEventArgs e)
		{
			if (e.IsDown)
			{
				switch (e.Key)
				{
					case Key.Up:
						if (inputHistoryIndex == inputHistory.Count)
						{
							// Save the current text
							currentInput = input.Text;
						}

						if (inputHistoryIndex > 0)
						{
							// Display the previous item in the input history
							inputHistoryIndex -= 1;
							input.Text = inputHistory[inputHistoryIndex];
							e.Handled = true;
						}
						break;

					case Key.Down:
						if (inputHistoryIndex == inputHistory.Count - 1)
						{
							// Display the saved current text
							input.Text = currentInput;
							inputHistoryIndex = inputHistory.Count;
							e.Handled = true;
						}
						else if (inputHistoryIndex < inputHistory.Count)
						{
							// Display the next item in the input history
							inputHistoryIndex += 1;
							input.Text = inputHistory[inputHistoryIndex];
							e.Handled = true;
						}
						break;

					default:
						break;
				}
			}
		}

		private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
		{
			foreach (var handler in handlers)
			{
				handler.Stop();
			}
		}

		private void Window_SizeChanged(object sender, SizeChangedEventArgs e)
		{
			if (this.expander.IsExpanded && e.HeightChanged)
			{
				expandedHeight = e.NewSize.Height;
			}
		}

		private void openAdminPage_Click(object sender, RoutedEventArgs e)
		{
			var address = App.GetServerAddress();
			if (address != null)
			{
				Process.Start(address);
			}
			else
			{
				MessageBox.Show("Could not determine server address.", "Error", MessageBoxButton.OK, MessageBoxImage.Warning);
			}
		}

		private void openPhpMyAdmin_Click(object sender, RoutedEventArgs e)
		{
			var address = App.GetServerAddress();
			if (address != null)
			{
				address = Path.Combine(address, "phpmyadmin");
				Process.Start(address);
			}
			else
			{
				MessageBox.Show("Could not determine server address.", "Error", MessageBoxButton.OK, MessageBoxImage.Warning);
			}
		}
	}
}