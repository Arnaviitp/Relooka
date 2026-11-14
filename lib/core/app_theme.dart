import 'package:flutter/material.dart';

import 'package:relooka/core/app_colors.dart';

/// Global theme and styling.
class AppTheme {
  AppTheme._();

  /// Serif display style used for headings and the logo.
  static TextStyle heading({
    double size = 24,
    FontWeight weight = FontWeight.w700,
    Color color = AppColors.textPrimary,
    double? height,
  }) =>
      TextStyle(
        fontFamily: 'Playfair Display',
        fontFamilyFallback: const ['Georgia', 'serif'],
        fontSize: size,
        fontWeight: weight,
        color: color,
        height: height,
      );

  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.accent,
        surface: AppColors.background,
      ),
      scaffoldBackgroundColor: AppColors.background,
    );

    return base.copyWith(
      textTheme: base.textTheme.apply(
        fontFamily: 'Inter',
        fontFamilyFallback: const [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        bodyColor: AppColors.textPrimary,
        displayColor: AppColors.textPrimary,
      ),
      dividerColor: AppColors.border,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.dark, width: 1.4),
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.dark,
      ),
    );
  }
}
