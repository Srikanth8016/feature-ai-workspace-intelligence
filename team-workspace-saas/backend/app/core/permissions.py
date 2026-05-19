def has_permission(
    role: str,
    required_roles: list
):
    return role in required_roles
