using System;
using System.Diagnostics;
using System.IO;

namespace JSDC.Launcher.Applications
{
	public class MySqlHandler : ApplicationHandler
	{
		private ProcessStartInfo processStartInfo;
		private ProcessStartInfo processStopInfo;

		public MySqlHandler()
		{
			var root = App.FindServerRoot();
			var mySqlRoot = Path.Combine(root.FullName, "mysql", "bin");
			var mySql = Path.Combine(mySqlRoot, "mysqld");
			var mySqlIni = Path.Combine(mySqlRoot, "my.ini");
			var args = String.Join(" ", String.Format(@"--defaults-file=""{0}""", mySqlIni), "--standalone");

			processStartInfo = new ProcessStartInfo(mySql, args);
			processStartInfo.UseShellExecute = false;
			processStartInfo.CreateNoWindow = true;

			var pv = Path.Combine(root.FullName, "apache", "bin", "pv");
			args = String.Join(" ", "-f", "-k", "mysqld.exe", "-q");
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
			var pid = Path.Combine(root.FullName, "mysql", "data", "mysql.pid");
			if (File.Exists(pid))
			{
				File.Delete(pid);
			}
		}
	}
}