import React, { useState } from 'react';
import { Card, Input, Button, Tabs, Badge } from '@dxp/ui';
import { useMemberProfile, useMemberPreferences } from '@dxp/sdk-react';
import { memberProfile as mockProfile, coverage as mockCoverage } from '../../data/mock';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { data: profileData } = useMemberProfile();
  const { data: prefsData } = useMemberPreferences();
  const [notifPrefs, setNotifPrefs] = useState({
    claimUpdates: true,
    authDecisions: true,
    careGaps: true,
    appointments: true,
    pharmacy: false,
    marketing: false,
  });

  // Use live profile data with mock fallback
  const name = profileData?.name ?? mockProfile.name;
  const dob = profileData?.dateOfBirth ?? mockProfile.dob;
  const email = profileData?.email ?? mockProfile.email;
  const phone = profileData?.phone ?? mockProfile.phone;
  const address = profileData?.address
    ? `${(profileData.address.line || []).join(', ')}, ${profileData.address.city}, ${profileData.address.state} ${profileData.address.postalCode}`
    : `${mockProfile.address.line.join(', ')}, ${mockProfile.address.city}, ${mockProfile.address.state} ${mockProfile.address.postalCode}`;
  const memberId = profileData?.memberId ?? mockProfile.id;
  const planName = profileData?.planName ?? mockCoverage.planName;
  const groupNumber = profileData?.groupNumber ?? mockCoverage.groupNumber;
  const effectiveDate = profileData?.effectiveDate ?? mockCoverage.period.start;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Settings</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Manage your profile, notifications, and preferences</p>
      </div>

      <Tabs
        tabs={[
          { key: 'profile', label: 'Profile' },
          { key: 'notifications', label: 'Notifications' },
          { key: 'security', label: 'Security' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'profile' && (
        <div className="pt-6 max-w-2xl space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">Full Name</label>
                <Input value={name} readOnly />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">Date of Birth</label>
                <Input value={dob} readOnly />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">Email</label>
                <Input value={email} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">Phone</label>
                <Input value={phone} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">Address</label>
              <Input value={address} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Plan Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Member ID</span><span className="font-mono font-bold">{memberId}</span></div>
              <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Plan</span><span className="font-bold">{planName}</span></div>
              <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Group</span><span className="font-mono">{groupNumber}</span></div>
              <div className="flex justify-between"><span className="text-[var(--dxp-text-secondary)]">Effective</span><span>{effectiveDate}</span></div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="pt-6 max-w-2xl">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              {Object.entries(notifPrefs).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[var(--dxp-text)] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                  <button
                    onClick={() => setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-[var(--dxp-brand)]' : 'bg-[var(--dxp-border)]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="pt-6 max-w-2xl space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">Current Password</label>
                <Input type="password" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">New Password</label>
                <Input type="password" placeholder="Enter new password" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">Confirm New Password</label>
                <Input type="password" placeholder="Confirm new password" />
              </div>
              <Button>Update Password</Button>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-4">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--dxp-text)]">SMS verification is currently enabled</p>
                <p className="text-xs text-[var(--dxp-text-secondary)] mt-0.5">Code sent to {phone}</p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
