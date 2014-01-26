using System;
using System.Collections.Generic;
using System.Windows.Media;

namespace ConsoleControlAPI
{
	public interface ITextColorizer
	{
		IEnumerable<Tuple<string, Brush>> Colorize(string text, Brush defaultBrush);
	}
}