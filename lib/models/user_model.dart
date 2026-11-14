/// Signed-in ReLooka user.
class AppUser {
  final String name;
  final String email;
  final String mobile;
  final String pincode;
  final String gender;

  /// Unique ReLooka ID shown on the profile, e.g. RLK-7K2M9Q.
  final String reLookaId;

  /// Government / institute ID captured at login (null until first login).
  final String? govId;

  /// Face Authentication Agent verification details (D:\Agents)
  final String? idType;
  final String? idVerificationStatus;
  final String? agentVerdict;
  final DateTime? verifiedAt;

  const AppUser({
    required this.name,
    required this.email,
    required this.mobile,
    required this.pincode,
    required this.gender,
    required this.reLookaId,
    this.govId,
    this.idType,
    this.idVerificationStatus,
    this.agentVerdict,
    this.verifiedAt,
  });

  bool get isFaceAuthVerified =>
      idVerificationStatus == 'verified' || agentVerdict == 'VERIFIED';

  AppUser copyWith({
    String? govId,
    String? idType,
    String? idVerificationStatus,
    String? agentVerdict,
    DateTime? verifiedAt,
  }) =>
      AppUser(
        name: name,
        email: email,
        mobile: mobile,
        pincode: pincode,
        gender: gender,
        reLookaId: reLookaId,
        govId: govId ?? this.govId,
        idType: idType ?? this.idType,
        idVerificationStatus:
            idVerificationStatus ?? this.idVerificationStatus,
        agentVerdict: agentVerdict ?? this.agentVerdict,
        verifiedAt: verifiedAt ?? this.verifiedAt,
      );

  /// "••••1234" style mask so the full ID is never displayed.
  String get maskedGovId {
    final id = govId;
    if (id == null || id.isEmpty) return 'Not added';
    final tail = id.length <= 4 ? id : id.substring(id.length - 4);
    return '••••$tail';
  }
}
