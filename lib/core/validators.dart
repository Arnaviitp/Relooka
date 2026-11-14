/// Form validators shared by sign-up, login, listing and payment forms.
/// Each returns an error message, or null when the value is valid.
class Validators {
  Validators._();

  static String? required(String? v, [String label = 'This field']) =>
      (v == null || v.trim().isEmpty) ? '$label is required' : null;

  static String? name(String? v) {
    if (v == null || v.trim().length < 2) return 'Enter your full name';
    return null;
  }

  static String? email(String? v) {
    final s = v?.trim() ?? '';
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(s)) {
      return 'Enter a valid email address';
    }
    return null;
  }

  /// 10-digit Indian mobile number starting with 6-9.
  static String? mobile(String? v) {
    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(v?.trim() ?? '')) {
      return 'Enter a valid 10-digit mobile number';
    }
    return null;
  }

  /// 6-digit Indian PIN code.
  static String? pincode(String? v) {
    if (!RegExp(r'^[1-9]\d{5}$').hasMatch(v?.trim() ?? '')) {
      return 'Enter a valid 6-digit pincode';
    }
    return null;
  }

  static String? password(String? v) {
    final s = v ?? '';
    if (s.length < 8) return 'Use at least 8 characters';
    if (!RegExp(r'[A-Za-z]').hasMatch(s) || !RegExp(r'\d').hasMatch(s)) {
      return 'Include letters and numbers';
    }
    return null;
  }

  static String? confirmPassword(String? v, String original) {
    if (v == null || v.isEmpty) return 'Confirm your password';
    if (v != original) return 'Passwords do not match';
    return null;
  }

  /// Government ID or institute ID number (letters, digits, - and /).
  static String? govId(String? v) {
    final s = v?.trim() ?? '';
    if (s.length < 6 || !RegExp(r'^[A-Za-z0-9\-\/ ]+$').hasMatch(s)) {
      return 'Enter a valid Gov ID / Institute ID (min 6 characters)';
    }
    return null;
  }

  static String? positiveNumber(String? v, String label) {
    final n = int.tryParse(v?.trim() ?? '');
    if (n == null || n <= 0) return 'Enter a valid $label';
    return null;
  }

  static String? upi(String? v) {
    if (!RegExp(r'^[\w.\-]{2,}@[a-zA-Z]{2,}$').hasMatch(v?.trim() ?? '')) {
      return 'Enter a valid UPI ID (e.g. name@upi)';
    }
    return null;
  }

  static String? cardNumber(String? v) {
    final s = (v ?? '').replaceAll(' ', '');
    if (!RegExp(r'^\d{13,19}$').hasMatch(s) || !_luhn(s)) {
      return 'Enter a valid card number';
    }
    return null;
  }

  /// MM/YY, not in the past.
  static String? expiry(String? v) {
    final m = RegExp(r'^(\d{2})\/(\d{2})$').firstMatch(v ?? '');
    if (m == null) return 'Use MM/YY';
    final month = int.parse(m.group(1)!);
    final year = 2000 + int.parse(m.group(2)!);
    if (month < 1 || month > 12) return 'Invalid month';
    final now = DateTime.now();
    if (year < now.year || (year == now.year && month < now.month)) {
      return 'Card has expired';
    }
    return null;
  }

  static String? cvv(String? v) {
    if (!RegExp(r'^\d{3,4}$').hasMatch(v ?? '')) return 'Invalid CVV';
    return null;
  }

  static bool _luhn(String digits) {
    var sum = 0;
    var alt = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var n = int.parse(digits[i]);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 == 0;
  }
}
