import 'dart:math';

import 'package:flutter/foundation.dart';

import 'package:relooka/models/user_model.dart';

/// Login and registration.
///
/// Local, in-memory stand-in: accounts disappear when the app restarts.
/// Replace [register] and [login] with real backend calls (and OTP
/// verification) later. Each returns an error message, or null on success.
class AuthService extends ChangeNotifier {
  final Map<String, AppUser> _users = {}; // keyed by mobile number
  AppUser? _user;

  AuthService() {
    // Seed default verified account for instant testing & evaluation
    final demo = AppUser(
      name: 'Ananya Sharma',
      email: 'ananya@relooka.in',
      mobile: '9876543210',
      pincode: '400050',
      gender: 'Women',
      reLookaId: 'RLK-9A8B7C',
      govId: 'MH0120249876',
      idType: 'Aadhaar Card',
      idVerificationStatus: 'verified',
      agentVerdict: 'VERIFIED',
      verifiedAt: DateTime(2026, 1, 15),
    );
    _users[demo.mobile] = demo;
  }

  AppUser? get user => _user;
  bool get isLoggedIn => _user != null;
  String? get name => _user?.name;

  /// Creates an account and signs the user in.
  ///
  /// [password] is validated by the form and would be sent to the backend
  /// to be hashed there. It is deliberately not kept on the device.
  Future<String?> register({
    required String name,
    required String email,
    required String mobile,
    required String password,
    required String pincode,
    required String gender,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    final m = mobile.trim();
    if (_users.containsKey(m)) {
      return 'An account with this mobile number already exists. Please log in.';
    }
    final user = AppUser(
      name: name.trim(),
      email: email.trim(),
      mobile: m,
      pincode: pincode.trim(),
      gender: gender,
      reLookaId: _generateId(),
    );
    _users[m] = user;
    _user = user;
    notifyListeners();
    return null;
  }

  /// Login with mobile number + area pincode + Gov ID / Institute ID.
  Future<String?> login({
    required String mobile,
    required String pincode,
    required String govId,
  }) async {
    await Future.delayed(const Duration(milliseconds: 400));
    final m = mobile.trim();
    final existing = _users[m];
    if (existing == null) {
      return 'No account found for this mobile number. Please sign up first.';
    }
    if (existing.pincode != pincode.trim()) {
      return 'Area pincode does not match our records.';
    }
    final id = govId.trim();
    final saved = existing.govId;
    if (saved != null && saved.toLowerCase() != id.toLowerCase()) {
      return 'Gov ID / Institute ID does not match our records.';
    }
    final updated = existing.copyWith(govId: id);
    _users[m] = updated;
    _user = updated;
    notifyListeners();
    return null;
  }

  /// Verification with Face Authentication Agent (D:\Agents)
  Future<void> setFaceAuthVerified({
    required String idType,
    required String govId,
    String agentVerdict = 'VERIFIED',
  }) async {
    if (_user == null) return;
    final updated = _user!.copyWith(
      govId: govId,
      idType: idType,
      idVerificationStatus: 'verified',
      agentVerdict: agentVerdict,
      verifiedAt: DateTime.now(),
    );
    _users[_user!.mobile] = updated;
    _user = updated;
    notifyListeners();
  }

  void logout() {
    _user = null;
    notifyListeners();
  }

  String _generateId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    final rnd = Random.secure();
    String id;
    do {
      id = 'RLK-${List.generate(6, (_) => chars[rnd.nextInt(chars.length)]).join()}';
    } while (_users.values.any((u) => u.reLookaId == id));
    return id;
  }
}
