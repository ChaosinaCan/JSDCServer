using JSDC.Launcher.Applications;
using System;
using System.Collections.Generic;
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
		const double UnexpandedHeight = 205;
		const double ExpandedMinHeight = 300;

		List<ApplicationHandler> Handlers = new List<ApplicationHandler>();
		double expandedHeight = 420;

		public MainWindow()
		{
			InitializeComponent();

			ApacheStatus.Handler = new ApacheHandler();
			MySqlStatus.Handler = new MySqlHandler();
			NodeStatus.Handler = new NodeHandler(console);

			Handlers.Add(ApacheStatus.Handler);
			Handlers.Add(MySqlStatus.Handler);
			Handlers.Add(NodeStatus.Handler);

			if (!App.IsDesignMode)
			{
				Task.Factory.StartNew(StartAllApplicationsAsync);
			}
		}

		public async void StartAllApplicationsAsync()
		{
			foreach (var handler in Handlers)
			{
				await Task.Factory.StartNew(() => handler.Start());
			}
		}

		private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
		{
			foreach (var handler in Handlers)
			{
				handler.Stop();
			}
		}

		private void input_KeyDown(object sender, KeyEventArgs e)
		{
			if (e.Key == Key.Enter)
			{
				console.WriteInput(input.Text + Environment.NewLine, true, Colors.MediumOrchid);
				input.Text = "";
			}
		}

		private void Window_SizeChanged(object sender, SizeChangedEventArgs e)
		{
			if (this.expander.IsExpanded && e.HeightChanged)
			{
				expandedHeight = e.NewSize.Height;
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
	}
}
