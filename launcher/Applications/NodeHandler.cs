using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace JSDC.Launcher.Applications
{
	public class NodeHandler : ApplicationHandler
	{
		private JSDC.ConsoleControl.WPF.ConsoleControl console;
		private ProcessStartInfo processStartInfo;

		public NodeHandler(JSDC.ConsoleControl.WPF.ConsoleControl console)
		{
			var root = App.FindServerRoot();
			var mainScript = Path.Combine(root.FullName, "node", "main.js");
			var arguments = String.Format(@"""{0}""", mainScript);

			processStartInfo = new ProcessStartInfo("node.exe", arguments);
			processStartInfo.WorkingDirectory = Path.Combine(root.FullName, "node");

			this.console = console;
		}

		public override void Start()
		{
			var process = console.StartProcess(processStartInfo);
			SetProcess(process);
		}

		public override void Stop()
		{
			if (IsRunning && CurrentProcess != null)
			{
				CurrentProcess.Kill();
			}
		}

		public override async Task StopAsync()
		{
			var shouldKill = await this.RunOnUIThreadAsync(() => IsRunning && CurrentProcess != null);
			var process = await this.RunOnUIThreadAsync(() => CurrentProcess);

			if (shouldKill)
			{
				process.Kill();
			}
		}
	}
}
