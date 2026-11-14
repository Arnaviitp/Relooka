import 'package:flutter/material.dart';

import 'package:relooka/core/app_colors.dart';

enum CustomButtonStyle { dark, accent, outline }

/// Reusable button used across the app.
class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final CustomButtonStyle style;
  final IconData? leadingIcon;
  final IconData? trailingIcon;
  final bool expanded;
  final bool loading;

  const CustomButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.style = CustomButtonStyle.dark,
    this.leadingIcon,
    this.trailingIcon,
    this.expanded = false,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    late Color bg;
    late Color fg;
    BorderSide side = BorderSide.none;
    switch (style) {
      case CustomButtonStyle.dark:
        bg = AppColors.dark;
        fg = Colors.white;
        break;
      case CustomButtonStyle.accent:
        bg = AppColors.accent;
        fg = AppColors.dark;
        break;
      case CustomButtonStyle.outline:
        bg = Colors.transparent;
        fg = AppColors.dark;
        side = const BorderSide(color: AppColors.dark);
        break;
    }

    final child = loading
        ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: fg),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (leadingIcon != null) ...[
                Icon(leadingIcon, size: 18),
                const SizedBox(width: 8),
              ],
              Text(label,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15)),
              if (trailingIcon != null) ...[
                const SizedBox(width: 8),
                Icon(trailingIcon, size: 18),
              ],
            ],
          );

    final button = ElevatedButton(
      onPressed: loading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: bg,
        foregroundColor: fg,
        disabledBackgroundColor: bg.withValues(alpha: 0.6),
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: side,
        ),
      ),
      child: child,
    );

    return expanded ? SizedBox(width: double.infinity, child: button) : button;
  }
}
