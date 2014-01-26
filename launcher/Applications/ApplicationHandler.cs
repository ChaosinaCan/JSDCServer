using System;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows;

namespace JSDC.Launcher.Applications
{
	public abstract class ApplicationHandler : DependencyObject
	{
		// Using a DependencyProperty as the backing store for CurrentProcess.  This enables animation, styling, binding, etc...
		public static readonly DependencyProperty CurrentProcessProperty =
			DependencyProperty.Register("CurrentProcess", typeof(Process), typeof(ApplicationHandler), new PropertyMetadata(null));

		// Using a DependencyProperty as the backing store for IsRunning.  This enables animation, styling, binding, etc...
		public static readonly DependencyProperty IsRunningProperty =
			DependencyProperty.Register("IsRunning", typeof(bool), typeof(ApplicationHandler), new PropertyMetadata(false));

		public event EventHandler Started;

		public event EventHandler Stopped;

		public Process CurrentProcess
		{
			get { return (Process)GetValue(CurrentProcessProperty); }
			private set { SetValue(CurrentProcessProperty, value); }
		}

		public bool IsRunning
		{
			get { return (bool)GetValue(IsRunningProperty); }
			private set { SetValue(IsRunningProperty, value); }
		}

		public abstract void Start();

		public virtual async Task StartAsync()
		{
			await Task.Factory.StartNew(Start);
		}

		public abstract void Stop();

		public virtual async Task StopAsync()
		{
			await Task.Factory.StartNew(Stop);
		}

		protected void OnStarted()
		{
			var evt = this.Started;
			if (evt != null)
			{
				evt(this, EventArgs.Empty);
			}
		}

		protected void OnStopped()
		{
			var evt = this.Stopped;
			if (evt != null)
			{
				evt(this, EventArgs.Empty);
			}
		}

		protected void SetProcess(Process process)
		{
			this.RunOnUIThread(() =>
			{
				this.CurrentProcess = process;
				process.Exited += process_Exited;

				this.UpdateStatus();
			});
		}

		protected void UpdateStatus()
		{
			var previousStatus = this.IsRunning;
			if (this.CurrentProcess == null)
			{
				this.IsRunning = false;
			}
			else
			{
				try
				{
					this.IsRunning = !CurrentProcess.HasExited;
				}
				catch
				{
					this.IsRunning = false;
				}
			}

			if (this.IsRunning && !previousStatus)
			{
				this.OnStarted();
			}
			if (!this.IsRunning && previousStatus)
			{
				this.OnStopped();
			}
		}

		private void process_Exited(object sender, EventArgs e)
		{
			this.RunOnUIThread(() =>
			{
				this.CurrentProcess = null;
				this.UpdateStatus();
			});
		}
	}
}