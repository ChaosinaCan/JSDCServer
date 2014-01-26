using ConsoleControlAPI;
using System;
using System.Collections.Generic;
using System.Windows.Media;

namespace JSDC.Launcher
{
	/// <summary>
	/// Colorizes lines of text with in the console output window
	/// </summary>
	public class ConsoleColorizer : ITextColorizer
	{
		public static readonly Color ErrorColor = Colors.DarkRed;
		public static readonly Color InfoColor = Colors.MediumOrchid;
		public static readonly Color WarnColor = Colors.OrangeRed;

		public IEnumerable<Tuple<string, Brush>> Colorize(string text, Brush defaultBrush)
		{
			// Split the text into lines
			var lines = text.Split('\n');
			for (var i = 0; i < lines.Length; i++)
			{
				var line = lines[i];

				// Add the newline character back onto the end of the line
				if (i != lines.Length - 1)
				{
					line += '\n';
				}

				// Search for certain substrings to determine what color this line should be:
				// Lines starting with "info:" are informational text.
				// Lines starting with "warn:" or containing "warning" are warnings.
				// Lines containing "error" are errors.
				var trimmed = line.Trim().ToLowerInvariant();
				var brush = defaultBrush;
				if (trimmed.StartsWith("info:"))
				{
					brush = new SolidColorBrush(InfoColor);
				}
				else if (trimmed.StartsWith("warn:") || trimmed.Contains("warning"))
				{
					brush = new SolidColorBrush(WarnColor);
				}
				else if (trimmed.Contains("error"))
				{
					brush = new SolidColorBrush(ErrorColor);
				}

				yield return new Tuple<string, Brush>(line, brush);
			}
		}
	}
}