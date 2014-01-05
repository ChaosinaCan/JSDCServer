using JSDC.Launcher.Applications;
using System;
using System.ComponentModel;
using System.Windows;
using System.Windows.Controls;

namespace JSDC.Launcher
{
	public enum ApplicationState
	{
		Stopped,
		Starting,
		Running,
		Stopping,
	};

	/// <summary>
	/// Interaction logic for ApplicationStatus.xaml
	/// </summary>
	public partial class ApplicationStatus : UserControl
	{
		/// <summary>
		/// The display name of the application
		/// </summary>
		public string ApplicationName
		{
			get { return (string)GetValue(ApplicationNameProperty); }
			set { SetValue(ApplicationNameProperty, value); }
		}

		// Using a DependencyProperty as the backing store for ApplicationName.  This enables animation, styling, binding, etc...
		public static readonly DependencyProperty ApplicationNameProperty =
			DependencyProperty.Register("ApplicationName", typeof(string), typeof(ApplicationStatus), new PropertyMetadata(String.Empty));

		/// <summary>
		/// true if the application is currently running
		/// </summary>
		public bool IsRunning
		{
			get { return (bool)GetValue(RunningProperty); }
			private set { SetValue(RunningProperty, value); }
		}

		// Using a DependencyProperty as the backing store for Running.  This enables animation, styling, binding, etc...
		public static readonly DependencyProperty RunningProperty =
			DependencyProperty.Register("IsRunning", typeof(bool), typeof(ApplicationStatus), new PropertyMetadata(false));

		/// <summary>
		/// The current state of the application
		/// </summary>
		public ApplicationState CurrentState
		{
			get { return (ApplicationState)GetValue(CurrentStateProperty); }
			set { SetValue(CurrentStateProperty, value); }
		}

		// Using a DependencyProperty as the backing store for CurrentState.  This enables animation, styling, binding, etc...
		public static readonly DependencyProperty CurrentStateProperty =
			DependencyProperty.Register("CurrentState", typeof(ApplicationState), typeof(ApplicationStatus), new PropertyMetadata(ApplicationState.Stopped));

		/// <summary>
		/// The ApplicationHandler in charge of starting and stopping the application
		/// </summary>
		public ApplicationHandler Handler
		{
			get { return (ApplicationHandler)GetValue(HandlerProperty); }
			set { SetValue(HandlerProperty, value); }
		}

		// Using a DependencyProperty as the backing store for Handler.  This enables animation, styling, binding, etc...
		public static readonly DependencyProperty HandlerProperty =
			DependencyProperty.Register("Handler", typeof(ApplicationHandler), typeof(ApplicationStatus), new PropertyMetadata(null));


		public ApplicationStatus()
		{
			InitializeComponent();
			LayoutRoot.DataContext = this;

			IsRunning = false;

			var desc = DependencyPropertyDescriptor.FromProperty(HandlerProperty, typeof(ApplicationStatus));
			desc.AddValueChanged(this, OnHandlerChanged);
		}

		/// <summary>
		/// Called when the ApplicationHandler property changes
		/// </summary>
		/// <param name="sender"></param>
		/// <param name="e"></param>
		protected void OnHandlerChanged(object sender, EventArgs e)
		{
			if (Handler == null)
			{
				IsRunning = false;
			}
			else
			{
				IsRunning = Handler.IsRunning;
				Handler.Started += Handler_Started;
				Handler.Stopped += Handler_Stopped;
			}
		}

		/// <summary>
		/// Called when the application handler reports that the application has started
		/// </summary>
		/// <param name="sender"></param>
		/// <param name="e"></param>
		protected void Handler_Started(object sender, EventArgs e)
		{
			IsRunning = true;
			CurrentState = ApplicationState.Running;
			controlButton.IsEnabled = true;
		}

		/// <summary>
		/// Called when the application handler reports that the application has stopped
		/// </summary>
		/// <param name="sender"></param>
		/// <param name="e"></param>
		protected void Handler_Stopped(object sender, EventArgs e)
		{
			IsRunning = false;
			controlButton.IsEnabled = true;
			CurrentState = ApplicationState.Stopped;
		}

		/// <summary>
		/// Called when the Start/Stop button is clicked
		/// </summary>
		/// <param name="sender"></param>
		/// <param name="e"></param>
		private async void controlButton_Click(object sender, RoutedEventArgs e)
		{
			// Disable the button
			(sender as Button).IsEnabled = false;

			// Toggle the state of the application
			if (IsRunning)
			{
				CurrentState = ApplicationState.Stopping;
				await Handler.StopAsync();
				CurrentState = ApplicationState.Stopped;
				IsRunning = false;
			}
			else
			{
				CurrentState = ApplicationState.Starting;
				await Handler.StartAsync();
				CurrentState = ApplicationState.Running;
				IsRunning = true;
			}

			// Re-enable the button
			(sender as Button).IsEnabled = true;
		}

	}
}
