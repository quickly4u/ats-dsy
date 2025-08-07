import React from 'react';
import { 
  Star,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  LinkedinIcon,
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import type { Candidate } from '../../types';

interface CandidateCardProps {
  candidate: Candidate;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ 
  candidate, 
  viewMode, 
  isSelected, 
  onSelect 
}) => {
  const renderStars = (rating?: number) => {
    const stars = [];
    const filledStars = rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={`${
            i <= filledStars 
              ? 'text-yellow-400 fill-current' 
              : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const getTagColor = (tag: string) => {
    const colors = {
      'Featured': 'bg-blue-100 text-blue-800',
      'Senior': 'bg-purple-100 text-purple-800',
      'Referral': 'bg-green-100 text-green-800',
      'Hot Lead': 'bg-red-100 text-red-800',
      'Portfolio': 'bg-indigo-100 text-indigo-800',
      'Local': 'bg-yellow-100 text-yellow-800',
    };
    return colors[tag as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-4">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          
          <img
            src={candidate.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2`}
            alt={`${candidate.firstName} ${candidate.lastName}`}
            className="w-12 h-12 rounded-full object-cover"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  {candidate.currentTitle} at {candidate.currentCompany}
                </p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1" />
                  {candidate.location}
                </div>
                <div className="flex items-center">
                  <Briefcase size={16} className="mr-1" />
                  {candidate.experienceYears}+ years
                </div>
                <div className="flex items-center space-x-1">
                  {renderStars(candidate.rating)}
                </div>
              </div>
            </div>
            
            <div className="mt-2 flex items-center space-x-4">
              <div className="flex flex-wrap gap-1">
                {candidate.skills.slice(0, 4).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {candidate.skills.length > 4 && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    +{candidate.skills.length - 4}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-auto">
                {candidate.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getTagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="p-6">
        {/* Header with checkbox and menu */}
        <div className="flex items-start justify-between mb-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Candidate Info */}
        <div className="text-center mb-4">
          <img
            src={candidate.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2`}
            alt={`${candidate.firstName} ${candidate.lastName}`}
            className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
          />
          <h3 className="text-lg font-semibold text-gray-900">
            {candidate.firstName} {candidate.lastName}
          </h3>
          <p className="text-sm text-gray-600">
            {candidate.currentTitle}
          </p>
          <p className="text-sm text-gray-500">
            {candidate.currentCompany}
          </p>
        </div>

        {/* Rating */}
        {candidate.rating && (
          <div className="flex justify-center items-center space-x-1 mb-4">
            {renderStars(candidate.rating)}
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 mb-4 text-sm text-gray-600">
          {candidate.location && (
            <div className="flex items-center">
              <MapPin size={16} className="mr-2 text-gray-400" />
              <span>{candidate.location}</span>
            </div>
          )}
          
          {candidate.experienceYears && (
            <div className="flex items-center">
              <Briefcase size={16} className="mr-2 text-gray-400" />
              <span>{candidate.experienceYears}+ years experience</span>
            </div>
          )}

          <div className="flex items-center">
            <Mail size={16} className="mr-2 text-gray-400" />
            <span className="truncate">{candidate.email}</span>
          </div>

          {candidate.phone && (
            <div className="flex items-center">
              <Phone size={16} className="mr-2 text-gray-400" />
              <span>{candidate.phone}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                +{candidate.skills.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {candidate.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {candidate.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getTagColor(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {candidate.summary && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {candidate.summary}
          </p>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {candidate.linkedinUrl && (
              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <LinkedinIcon size={16} />
              </button>
            )}
            {candidate.portfolioUrl && (
              <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                <ExternalLink size={16} />
              </button>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Source: {candidate.source}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;