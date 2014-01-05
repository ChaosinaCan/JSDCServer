using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JSDC.Launcher.Applications
{
	public class ApacheHandler : ApplicationHandler
	{
		private ProcessStartInfo processStartInfo;
		private ProcessStartInfo processStopInfo;

		public ApacheHandler()
		{
			var root = App.FindServerRoot();
			var apache = Path.Combine(root.FullName, "apache", "bin", "httpd.exe");
			processStartInfo = new ProcessStartInfo(apache);
			processStartInfo.UseShellExecute = false;
			processStartInfo.CreateNoWindow = true;

			var pv = Path.Combine(root.FullName, "apache", "bin", "pv");
			var args = String.Join(" ", "-f", "-k", "httpd.exe", "-q");
			processStopInfo = new ProcessStartInfo(pv, args);
			processStopInfo.UseShellExecute = false;
			processStopInfo.CreateNoWindow = true;
		}

		public override void Start()
		{
			var process = Process.Start(processStartInfo);
			SetProcess(process);
		}

		public override void Stop()
		{
			var process = Process.Start(processStopInfo);
			process.WaitForExit();

			var root = App.FindServerRoot();
			var pid = Path.Combine(root.FullName, "apache", "logs", "httpd.pid");
			if (File.Exists(pid))
			{
				File.Delete(pid);
			}
		}
	}
}
