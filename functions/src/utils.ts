export class Utils {
    isRoleInRolesRequired(userRole: string, requiredRoles: string[]): boolean {
        try {
            if(userRole === null || requiredRoles === null){
                return false;
            } else {
                let authorised = false
                requiredRoles.forEach((role) => {
                    if(role === userRole) {
                        authorised = true;
                    }
                });
                return authorised;
            }
        } catch (err) {
            console.log('isRoleInRolesRequired err: ', userRole, requiredRoles);
            return false;
        }
    }

    
}


