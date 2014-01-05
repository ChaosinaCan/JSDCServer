using System.IO;
using System.Linq;
using System.Windows;

namespace JSDC.Launcher
{
	/// <summary>
	/// Interaction logic for App.xaml
	/// </summary>
	public partial class App : Application
	{
		/// <summary>
		/// Returns true if the code is being run by a code editor
		/// </summary>
		public static bool IsDesignMode
		{
			get
			{
				return System.ComponentModel.DesignerProperties.GetIsInDesignMode(new DependencyObject());
			}
		}

		/// <summary>
		/// Finds the root directory of the server
		/// </summary>
		/// <returns></returns>
		public static DirectoryInfo FindServerRoot()
		{
			var currentDir = Directory.GetParent(System.Reflection.Assembly.GetExecutingAssembly().Location);
			while (currentDir != null && currentDir.Exists)
			{
				// Search upwards through the directory tree for the "ci" directory
				if (currentDir.GetDirectories().Any((dir) => dir.Name == "ci"))
				{
					return currentDir;
				}
				else
				{
					currentDir = currentDir.Parent;
				}
			}
			return null;
		}
	}
}
